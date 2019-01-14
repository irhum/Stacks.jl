"""
    borrow from https://github.com/Roger-luo/BatchedRoutines.jl
"""

import LinearAlgebra: BLAS
import CuArrays

#batched CuArray gemm by BatchedRoutines.jl
for (gemm, elty) in
    ((:dgemm_,:Float64),
     (:sgemm_,:Float32))
    @eval begin
        function batched_gemm!(transA::AbstractChar,
                               transB::AbstractChar,
                               alpha::($elty),
                               A::CuArrays.CuArray{$elty, 3},
                               B::CuArrays.CuArray{$elty, 3},
                               beta::($elty),
                               C::CuArrays.CuArray{$elty, 3})
            gemm_strided_batched!(transA, transB, alpha, A, B, beta, C)
        end
    end
end

#batched cpu gemm by BatchedRoutines.jl
for (gemm, elty) in
    ((:dgemm_,:Float64),
     (:sgemm_,:Float32),)
    @eval begin
        function batched_gemm!(transA::AbstractChar,
                               transB::AbstractChar,
                               alpha::($elty),
                               A::AbstractArray{$elty, 3},
                               B::AbstractArray{$elty, 3},
                               beta::($elty),
                               C::AbstractArray{$elty, 3})
            @assert !BLAS.has_offset_axes(A, B, C)
            @assert size(A, 3) == size(B, 3) == size(C, 3) "batch size mismatch"
            m = size(A, transA == 'N' ? 1 : 2)
            ka = size(A, transA == 'N' ? 2 : 1)
            kb = size(B, transB == 'N' ? 1 : 2)
            n = size(B, transB == 'N' ? 2 : 1)
            if ka != kb || m != size(C,1) || n != size(C,2)
                throw(DimensionMismatch("A has size ($m,$ka), B has size ($kb,$n), C has size $(size(C))"))
            end
            BLAS.chkstride1(A)
            BLAS.chkstride1(B)
            BLAS.chkstride1(C)

            ptrA = Base.unsafe_convert(Ptr{$elty}, A)
            ptrB = Base.unsafe_convert(Ptr{$elty}, B)
            ptrC = Base.unsafe_convert(Ptr{$elty}, C)

            for k in 1:size(A, 3)
                ccall((BLAS.@blasfunc($gemm), BLAS.libblas), Cvoid,
                    (Ref{UInt8}, Ref{UInt8}, Ref{BLAS.BlasInt}, Ref{BLAS.BlasInt},
                     Ref{BLAS.BlasInt}, Ref{$elty}, Ptr{$elty}, Ref{BLAS.BlasInt},
                     Ptr{$elty}, Ref{BLAS.BlasInt}, Ref{$elty}, Ptr{$elty},
                     Ref{BLAS.BlasInt}),
                     transA, transB, m, n,
                     ka, alpha, ptrA, max(1,stride(A,2)),
                     ptrB, max(1,stride(B,2)), beta, ptrC,
                     max(1,stride(C,2)))

                ptrA += size(A, 1) * size(A, 2) * sizeof($elty)
                ptrB += size(B, 1) * size(B, 2) * sizeof($elty)
                ptrC += size(C, 1) * size(C, 2) * sizeof($elty)
            end

            C
        end
    end
end


#api for gemm_strided_batched!
#can be remove when new CUBLAS.jl release
for (fname, elty) in
        ((:cublasDgemmStridedBatched,:Float64),
         (:cublasSgemmStridedBatched,:Float32))
    @eval begin
      function gemm_strided_batched!(transA::Char,
                               transB::Char,
                               alpha::($elty),
                               A::CuArrays.CuArray{$elty, 3},
                               B::CuArrays.CuArray{$elty, 3},
                               beta::($elty),
                               C::CuArrays.CuArray{$elty, 3})
           m = size(A, transA == 'N' ? 1 : 2)
           k = size(A, transA == 'N' ? 2 : 1)
           n = size(B, transB == 'N' ? 2 : 1)

           @assert size(A, 3) == size(B, 3) == size(C, 3) "Batch size mismatch"

           if m != size(C,1) || n != size(C,2) || k != size(B, transB == 'N' ? 1 : 2)
               throw(DimensionMismatch(""))
           end
           cutransA = CuArrays.CUBLAS.cublasop(transA)
           cutransB = CuArrays.CUBLAS.cublasop(transB)
           lda = max(1,stride(A,2))
           ldb = max(1,stride(B,2))
           ldc = max(1,stride(C,2))

           strideA = stride(A, 3)
           strideB = stride(B, 3)
           strideC = stride(C, 3)
           batchCount = size(A, 3)
           CuArrays.CUBLAS.@check ccall(($(string(fname)), CuArrays.libcublas), CuArrays.CUBLAS.cublasStatus_t,
                        (CuArrays.CUBLAS.cublasHandle_t, CuArrays.CUBLAS.cublasOperation_t,
                         CuArrays.CUBLAS.cublasOperation_t, Cint, Cint, Cint, Ptr{$elty},
                         Ptr{$elty}, Cint, Cint, Ptr{$elty}, Cint, Cint, Ptr{$elty},
                         Ptr{$elty}, Cint, Cint, Cint),
                        CuArrays.CUBLAS.libcublas_handle[], cutransA,
                        cutransB, m, n, k, [alpha], A, lda, strideA, B, ldb, strideB, [beta],
                        C, ldc, strideC, batchCount)
           C
           end
    end
end
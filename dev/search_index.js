var documenterSearchIndex = {"docs":
[{"location":"advanced/#Advanced-Uses","page":"Advanced Uses","title":"Advanced Uses","text":"","category":"section"},{"location":"advanced/#Interpolation","page":"Advanced Uses","title":"Interpolation","text":"","category":"section"},{"location":"advanced/","page":"Advanced Uses","title":"Advanced Uses","text":"We also support interpolation, so you can use a variable to hold a substructure or the unroll number. But notice that the interpolation variable should always be at the top level of the module since we can only get that value with eval. (To interpolate local variables, use @nntopo_str \"topo_pattern\" instead)","category":"page"},{"location":"advanced/","page":"Advanced Uses","title":"Advanced Uses","text":"N = 3\ntopo = @nntopo((e, m, mask):e → pe:(e, pe) → t → (t:(t, m, mask) → t:(t, m, mask)) → $N:t → c)\n\n# alternatively\n# topo = @nntopo_str \"(e, m, mask):e → pe:(e, pe) → t → (t:(t, m, mask) → t:(t, m, mask)) → $N:t → c\"\n\nprint_topo(topo)\n# \n# NNTopo{\"(e, m, mask):e → (pe:(e, pe) → (t → ((t:(t, m, mask) → t:(t, m, mask)) → (3:t → c))))\"}\n# topo_func(model, e, m, mask)\n#         pe = model[1](e)\n#         t = model[2](e, pe)\n#         t = model[3](t)\n#         t = model[4](t, m, mask)\n#         t = model[5](t, m, mask)\n#         t = model[6](t, m, mask)\n#         c = model[7](t)\n#         c\n# end","category":"page"},{"location":"advanced/#Collect-Variables","page":"Advanced Uses","title":"Collect Variables","text":"","category":"section"},{"location":"advanced/","page":"Advanced Uses","title":"Advanced Uses","text":"You can also collect intermediate variables you are interested in with ' on that variable. This allows you to define and train a model, and only make changes to its structure (and not the layers of the model itself) if you need access to intermediate outputs for downstream tasks. For example:","category":"page"},{"location":"advanced/","page":"Advanced Uses","title":"Advanced Uses","text":"julia> @nntopo x => y' => 3 => z\n# NNTopo{\"x => (y' => (3 => z))\"}\n# topo_func(model, x)\n#         y = model[1](x)\n#         %1 = y\n#         y = model[2](y)\n#         %2 = y\n#         y = model[3](y)\n#         %3 = y\n#         y = model[4](y)\n#         %4 = y\n#         z = model[5](y)\n#         (z, (%1, %2, %3, %4))\n# end\n\njulia> @nntopo (x,y) => (a,b,c,d') => (w',r',y) => (m,n)' => z\n# NNTopo{\"(x, y) => ((a, b, c, d') => ((w', r', y) => (((m, n))' => z)))\"}\n# topo_func(model, x, y)\n#         (a, b, c, d) = model[1](x, y)\n#         %1 = d\n#         (w, r, y) = model[2](a, b, c, d)\n#         %2 = (w, r)\n#         (m, n) = model[3](w, r, y)\n#         %3 = (m, n)\n#         z = model[4](m, n)\n#         (z, (%1, %2, %3))\n# end","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"DocTestSetup = quote\n  using Stacks\nend","category":"page"},{"location":"#Introduction","page":"Introduction","title":"Introduction","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Adapted from Transformers.jl","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Stacks.jl allows you to cleanly build flexible neural networks whose layers can take any number of inputs, and produce any number of outputs. It achieves this by seperating the layers themselves from the structure of the inputs/outputs the layers take in/produce. To accomplish this, this package provides two core features:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"@nntopo: A macro that uses a compact DSL (Domain Specific Language) to store the structure of the function composition in an NNTopo.\nStack: Similar to a Flux.Chain, except it takes in an NNTopo as its first argument to determine which inputs to pass into each layer.  ","category":"page"},{"location":"#NNTopo","page":"Introduction","title":"NNTopo","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"We store the structure of the model in a NNTopo, short for \"Neural Network Topology\". At its core, it is simply used to define inputs and outputs for each function in a sequence of function calls. Consider it a supercharged version of Julia's piping operator (|>). ","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"NNTopos are usually created by using the @nntopo macro as shown:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"@nntopo","category":"page"},{"location":"#Stacks.@nntopo","page":"Introduction","title":"Stacks.@nntopo","text":"@nntopo structure\n\nCreate an NNTopo to apply functions according to the given structure.\n\nExample\n\njulia> @nntopo x:x => h1:x => h2:(h1, h2) => o\nNNTopo{\"x:x => (h1:x => (h2:(h1, h2) => o))\"}\nfunction(model, x)\n    h1 = model[1](x)\n    h2 = model[2](x)\n    o = model[3](h1, h2)\n    o\nend\n\n\n\n\n\n","category":"macro"},{"location":"","page":"Introduction","title":"Introduction","text":"We elaborate on how to specify structure using @nntopo in the following sections.","category":"page"},{"location":"#Chaining-functions","page":"Introduction","title":"Chaining functions","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Suppose you want to chain the functions g, f and h in the following way:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"y = h(f(g(x))) # a chain of function calls","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"You could instead write the following:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"julia\n# or equivalently\na = g(x)\nb = f(a)\ny = h(b)","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Or you could take the Stacks.jl approach, which is to seperate the structure from the functions:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"julia\ntopo = @nntopo x => a => b => y # first we define the topology/architecture\ny = topo((g, f, h), x) # then call on the given functions","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"First, we create topo (which has type NNTopo) using @nntopo. The inputs to @nntopo are parsed in the following way:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Each variable name (e.g b) is a symbol that represents a function input/output. Note that these symbols have no relation with globally defined variables (in the same way that a in f(a) = a^2 has no relation with a previously defined a in the Julia session)\nEach => represents a function call, with the left hand side being the input argument and right hand side being the symbol used to represent the output. ","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Note that @nntopo simply creates the structure of the function calls; it does not actually perform the function calls until the generated NNTopo struct is called with concrete functions (in this case (g, f, h))","category":"page"},{"location":"#Multiple-arguments-and-skip-connections","page":"Introduction","title":"Multiple arguments & skip connections","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"As we metioned above, the original intention was to handle the case that we multiple inputs and multiple outputs. We can do this with the following syntax: ","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"# a complex structure\n# x1 to x4 in the given inputs\nt = f(x1, x2)\nz1, z2 = g(t, x3)\nw = h(x4, z1)\ny = k(x2, z2, w)\n\n# is equivalent to \ntopo = @nntopo (x1, x2, x3, x4):(x1, x2) => t:(t, x3) => (z1, z2):(x4, z1) => w:(x2, z2, w) => y\ny = topo((f, g, h, k), x1, x2, x3, x4)\n\n# you can also see the function call order with `print_topo` function\nprint_topo(topo; models=(f, g, h, k))\n# \n# NNTopo{\"(x1, x2, x3, x4):(x1, x2) => (t:(t, x3) => ((z1, z2):(x4, z1) => (w:(x2, z2, w) => y)))\"}\n# topo_func(model, x1, x2, x3, x4)\n#         t = f(x1, x2)\n#         (z1, z2) = g(t, x3)\n#         w = h(x4, z1)\n#         y = k(x2, z2, w)\n#         y\n# end","category":"page"},{"location":"#Seperating-inputs-and-outputs","page":"Introduction","title":"Seperating inputs and outputs","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Notice that we use a : to seperate the input/output variable names for each function call. If the : is not present, we will by default assume that all output variables are the inputs of the next function call. i.e. x => (t1, t2) => y is equivalent to x => (t1, t2):(t1, t2) => y. ","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"We can also return multiple variables, so the complete syntax can be viewed as:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"    (input arguments):(function1 inputs) => (function1 outputs):(function2 inputs):(function2 outputs) => .... => (function_n outputs):(return variables)","category":"page"},{"location":"#Loop-unrolling","page":"Introduction","title":"Loop unrolling","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"you can also unroll a loop:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"y = g(f(f(f(f(x)))))\n\n# or \ntmp = x\nfor i = 1:4\n  tmp = f(tmp)\nend\ny = g(tmp)\n\n# is equivalent to \ntopo = @nntopo x => 4 => y\ny = topo((f,f,f,f, g), x) ","category":"page"},{"location":"#Nested-Structure","page":"Introduction","title":"Nested Structure","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"You can also use the () to create a nested structure for the unroll.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"topo = @nntopo x => ((y => z => t) => 3 => w) => 2\nprint_topo(topo)\n# \n# NNTopo{\"x => (((y => (z => t)) => (3 => w)) => 2)\"}\n# topo_func(model, x)\n#         y = model[1](x)\n#         z = model[2](y)\n#         t = model[3](z)\n#         z = model[4](t)\n#         t = model[5](z)\n#         z = model[6](t)\n#         t = model[7](z)\n#         w = model[8](t)\n#         z = model[9](w)\n#         t = model[10](z)\n#         z = model[11](t)\n#         t = model[12](z)\n#         z = model[13](y)\n#         t = model[14](z)\n#         w = model[15](t)\n#         w\n# end","category":"page"},{"location":"#Stack","page":"Introduction","title":"Stack","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"With the NNTopo DSL, we can use the NNTopo with our Stack type, which is like Flux.Chain except that we also need to pass in the NNTopo for the architecture. You can check the actual function call with show_stackfunc, which integrates print_topo with the actual names of the layers in the Stack.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"# An example Decoder (from Attention Is All You Need)\n\nusing Transformers\n\nN = 3\n\nStack(\n@nntopo((e, m, mask):e → pe:(e, pe) → t → (t:(t, m, mask) → t:(t, m, mask)) → $N:t → c),\nPositionEmbedding(512),\n(e, pe) -> e .+ pe,\nDropout(0.1),\n[TransformerDecoder(512, 8, 64, 2048) for i = 1:N]...,\nPositionwise(Dense(512, length(labels)), logsoftmax)\n)\n\njulia> show_stackfunc(s)\n# topo_func(model, e, m, mask)\n#         pe = PositionEmbedding(512)(e)\n#         t = getfield(Main, Symbol(\"##23#25\"))()(e, pe)\n#         t = Dropout{Float64}(0.1, true)(t)\n#         t = TransformerDecoder(head=8, head_size=64, pwffn_size=2048, size=512, dropout=0.1)(t, m, mask)\n#         t = TransformerDecoder(head=8, head_size=64, pwffn_size=2048, size=512, dropout=0.1)(t, m, mask)\n#         t = TransformerDecoder(head=8, head_size=64, pwffn_size=2048, size=512, dropout=0.1)(t, m, mask)\n#         c = Positionwise{Tuple{Dense{typeof(identity),TrackedArray{…,Array{Float32,2}},TrackedArray{…,Array{Float32,1}}},typeof(logsoftmax)}}((Dense(512, 12), NNlib.logsoftmax))(t)\n#         c\n# end","category":"page"}]
}

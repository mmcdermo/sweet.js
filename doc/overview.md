# Sweet.js

## Core Structures

The main data types are `Syntax` and `TermTree`:

    Syntax :: {
        token   :: Token,
        context :: Context,
        mark    :: (Int?) -> Syntax
        rename  :: (Syntax or [Syntax], Str) -> Syntax
        push_dummy_rename :: (Str) -> Syntax
        swap_dummy_rename :: (Syntax, Str, Str) -> Syntax 
    }

The `Syntax` object holds the token (a holdover data structure from esprima which knows about the token's value and line numbers) and its context (a structure of marks and renames used for hygiene) along with a couple of methods to help with hygiene.

Each `Syntax` object is in one-to-one correlation with an individual token.

In contrast, the `TermTree` object holds a collection of of `Syntax` objects in a closer and closer approximation of the final AST.

    TermTree :: {
        destruct :: () -> [Syntax]
    }

It's basically an AST, just not as complete as the final AST generated by esprima. Productions in the grammar then are represented by individual term trees:

    BinOp extends TermTree :: {
        left    :: TermTree
        op      :: TermTree
        right   :: TermTree
    }

## expand

The main entry point into the expander is, appropriately enough, `expand`:

    expand :: ([Syntax], Map, Map) -> [TermTree]
    function expand(toks, env, ctx) { ... }

The `expand` function is primarily responsible for handling hygiene. Most of its work happens when dealing with functions (renaming all the parameters and whatnot). The `env` param is a mapping from identifiers to macro definitions and `ctx` is a mapping of names to names (used for hygiene).

The `expand` function delegates to two sub expand like functions:

    expandToTermTree :: ([Syntax], Map) -> {terms: [TermTree], env: Map}

Responsible for converting the syntax to TermTrees and loading any macro definitions it finds into the new `env` map.

    expandTermTreeToFinal :: (TermTree, Map, Map) -> TermTree

Responsible for packing each term tree into its final state. This means recursively expanding sub trees and handling various hygiene tasks.

These are roughly analogous to `parse1` and `parse2` in the honu paper.

## enforest

The `enforest` function deals with transforming `Syntax` objects to a `TermTree`:

    enforest :: ([Syntax], Map) -> {
        result  :: TermTree
        rest    :: [Syntax] 
    }


# Honu

The main contracts for honu:

    parse    :: ([Syntax], Env)     -> AST
    parse1   :: ([Syntax], Env)     -> ([TermTree], Env)
    parse2   :: ([TermTree], Env)   -> AST

    enforest :: ([Syntax], Env)     -> (TermTree, [Syntax])

    data TermTree = Macro Str [Syntax]
                  | Expr [TermTree]
                  | Bop TermTree Str TermTree
                  | Fun Str [TermTree] [Syntax]
                  | Block [Syntax]
                  | Id Syntax
                  | Lit Syntax
                  | Call [TermTree] [TermTree]

Some partial pattern matching definitions in a haskelly notation:

    parse :: ([Syntax], Env) -> AST
    parse stx env = let (terms, env') = parse1 stx env 
                    in parse2 terms env'

    parse1 :: [Syntax] -> Env -> ([TermTree], Env)
    parse1 [] env = ([], env)
    parse1 in env = 
        case (enforest in env) of
            (Macro n b, rest)  -> parse1 rest (update n (loadm b))
            (Expr e, rest)     -> (Expr e) : (parse1 rest env)
            -- case when var declaration (somewhat complicated)

    parse2 :: [TermTree] -> Env -> AST
    parse2 forms env = map parse2' forms 

    parse2' (Fun n vs b) env = FunAST n vs (parse b (aug env vs))
    parse2' (Block b) env    = BlockAST (parse b env)
    parse2' (Id i) env       = IdAST i
    parse2' (Lit l) env      = LitAST l
    parse2' (Call l r) env   = CallAST (parse2 l env) (parse2 r env) 
    parse2' (Bop l o r) env  = BopAST (parse2 l env) o (parse2 r env) 

And the `enforest` function itself:

    data Syntax = LitR Int
                | IdR Str
                | BinopR Str
                | ParenR [Syntax]
                | ...

    enforest :: [Syntax] -> Env -> (TermTree, [Syntax])

    enforest (LitR n:rest) env = enforest (Lit n:rest) env
    enforest (IdR i:rest) env 
        | lookup i env == Var id  = enforest (Id id:rest) env
        | lookup i env == Macro t = enforest (t rest) env
    enforest (ltree:(IdR i):rest) env
        | lookup i env == BopR op = case enforest rest env of
            (rtree, rest) -> enforest (Bop ltree op rtree:rest) env
    -- similar for uop
    enforest (ltree:ParenR args:rest) 
        | -- each arg must enforest to have no `rest`
        = enforest (Call ltree argtrees:rest) env 


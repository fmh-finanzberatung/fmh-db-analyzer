let SessionLoad = 1
let s:so_save = &g:so | let s:siso_save = &g:siso | setg so=0 siso=0 | setl so=-1 siso=-1
let v:this_session=expand("<sfile>:p")
silent only
silent tabonly
cd ~/projects/node.js/fmh-db-analyzer
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
set shortmess=aoO
badd +1 test
badd +1 ~/projects/node.js/fmh-db-analyzer
badd +27 lib/resolvers/helpers/mysql-data-loader.js
badd +1 test/mysql-schema-journal-adapters.test.js
badd +539 lib/resolvers/graphql-mysql-resolve-builder.js
argglobal
%argdel
edit lib/resolvers/helpers/mysql-data-loader.js
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
wincmd _ | wincmd |
vsplit
2wincmd h
wincmd w
wincmd _ | wincmd |
split
1wincmd k
wincmd w
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 101 + 101) / 203)
exe '2resize ' . ((&lines * 44 + 45) / 90)
exe 'vert 2resize ' . ((&columns * 90 + 101) / 203)
exe '3resize ' . ((&lines * 43 + 45) / 90)
exe 'vert 3resize ' . ((&columns * 90 + 101) / 203)
exe 'vert 4resize ' . ((&columns * 10 + 101) / 203)
argglobal
setlocal fdm=indent
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=1
setlocal fml=1
setlocal fdn=10
setlocal nofen
let s:l = 36 - ((35 * winheight(0) + 44) / 88)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 36
normal! 021|
lcd ~/projects/node.js/fmh-db-analyzer
wincmd w
argglobal
if bufexists("~/projects/node.js/fmh-db-analyzer/lib/resolvers/graphql-mysql-resolve-builder.js") | buffer ~/projects/node.js/fmh-db-analyzer/lib/resolvers/graphql-mysql-resolve-builder.js | else | edit ~/projects/node.js/fmh-db-analyzer/lib/resolvers/graphql-mysql-resolve-builder.js | endif
if &buftype ==# 'terminal'
  silent file ~/projects/node.js/fmh-db-analyzer/lib/resolvers/graphql-mysql-resolve-builder.js
endif
setlocal fdm=indent
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=1
setlocal fml=1
setlocal fdn=10
setlocal nofen
let s:l = 545 - ((18 * winheight(0) + 22) / 44)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 545
normal! 042|
lcd ~/projects/node.js/fmh-db-analyzer
wincmd w
argglobal
if bufexists("~/projects/node.js/fmh-db-analyzer/test/mysql-schema-journal-adapters.test.js") | buffer ~/projects/node.js/fmh-db-analyzer/test/mysql-schema-journal-adapters.test.js | else | edit ~/projects/node.js/fmh-db-analyzer/test/mysql-schema-journal-adapters.test.js | endif
if &buftype ==# 'terminal'
  silent file ~/projects/node.js/fmh-db-analyzer/test/mysql-schema-journal-adapters.test.js
endif
setlocal fdm=indent
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=1
setlocal fml=1
setlocal fdn=10
setlocal nofen
let s:l = 38 - ((28 * winheight(0) + 21) / 43)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 38
normal! 0
lcd ~/projects/node.js/fmh-db-analyzer
wincmd w
argglobal
enew
file ~/projects/node.js/fmh-db-analyzer/-MINIMAP-
balt ~/projects/node.js/fmh-db-analyzer/lib/resolvers/graphql-mysql-resolve-builder.js
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=1
setlocal fml=1
setlocal fdn=10
setlocal nofen
lcd ~/projects/node.js/fmh-db-analyzer
wincmd w
2wincmd w
exe 'vert 1resize ' . ((&columns * 101 + 101) / 203)
exe '2resize ' . ((&lines * 44 + 45) / 90)
exe 'vert 2resize ' . ((&columns * 90 + 101) / 203)
exe '3resize ' . ((&lines * 43 + 45) / 90)
exe 'vert 3resize ' . ((&columns * 90 + 101) / 203)
exe 'vert 4resize ' . ((&columns * 10 + 101) / 203)
tabnext 1
if exists('s:wipebuf') && len(win_findbuf(s:wipebuf)) == 0&& getbufvar(s:wipebuf, '&buftype') isnot# 'terminal'
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20 shortmess=filnxtToOF
let &winminheight = s:save_winminheight
let &winminwidth = s:save_winminwidth
let s:sx = expand("<sfile>:p:r")."x.vim"
if filereadable(s:sx)
  exe "source " . fnameescape(s:sx)
endif
let &g:so = s:so_save | let &g:siso = s:siso_save
set hlsearch
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :

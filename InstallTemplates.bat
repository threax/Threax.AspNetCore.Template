set BASE=%~dp0
set SEARCH=%BASE%
pushd %SEARCH%
FOR /R %BASE% %%I in (*install.bat) DO call %%I 
popd
# Threax.AspnetCore.Template
This is the template app for building hypermedia applications. It uses the dotnet new command.

## Installing Templates
Run InstallTemplates.bat or do `dotnet new -i .` in each of the directories.

## Building Dockerfile
To build this image you will need to use the experimental buildkit. This applies to any projects built with this template.

First set your environment variable to enable buildkit (powershell)
```
$env:DOCKER_BUILDKIT=1
```

Then invoke the build like this.
```
docker build . -f .\AppTemplate\Dockerfile -t apptemplate --progress=plain
```
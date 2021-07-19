Param(
    [Parameter(Mandatory=$true)] [String] $port,
    [Parameter(Mandatory=$true)] [String] $containerName
)

dotnet new threaxapp --port $port --containername $containerName
FROM microsoft/dotnet:2.2.1-aspnetcore-runtime AS base
WORKDIR /app

FROM threax/build AS build
WORKDIR /src
COPY . .
WORKDIR /src/AppTemplate
RUN yarn run yarn-install
RUN dotnet restore AppTemplate.csproj
RUN dotnet build AppTemplate.csproj -c Release -o /app
RUN yarn run clean
RUN yarn run build

FROM build AS publish
RUN dotnet publish AppTemplate.csproj -c Release -o /app

FROM base AS final
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "AppTemplate.dll"]

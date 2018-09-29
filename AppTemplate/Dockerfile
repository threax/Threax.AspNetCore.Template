FROM microsoft/dotnet:2.1.3-aspnetcore-runtime AS base
WORKDIR /app
EXPOSE 80

FROM build-threax AS build
WORKDIR /src
COPY AppTemplate/AppTemplate.csproj AppTemplate/
RUN dotnet restore AppTemplate/AppTemplate.csproj
COPY . .
WORKDIR /src/AppTemplate
RUN yarn run yarn-install
RUN yarn run clean
RUN yarn run build
RUN dotnet build AppTemplate.csproj -c Release -o /app

FROM build AS publish
RUN dotnet publish AppTemplate.csproj -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "AppTemplate.dll"]

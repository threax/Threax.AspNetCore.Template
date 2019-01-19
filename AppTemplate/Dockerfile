FROM microsoft/dotnet:2.2.1-aspnetcore-runtime AS base
WORKDIR /app
EXPOSE 80

FROM threax/build AS build
WORKDIR /src
COPY AppTemplate/AppTemplate.csproj AppTemplate/
RUN dotnet restore AppTemplate/AppTemplate.csproj
COPY . .
WORKDIR /src/AppTemplate
RUN dotnet build AppTemplate.csproj -c Release -o /app

FROM build AS publish
RUN yarn run yarn-install
RUN yarn run clean
RUN yarn run build
RUN dotnet publish AppTemplate.csproj -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "AppTemplate.dll"]

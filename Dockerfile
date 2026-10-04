# syntax=docker/dockerfile:1

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN apk add --no-cache curl \
    && addgroup -S app \
    && adduser -S -G app app
WORKDIR /app
COPY --from=build /workspace/target/express-api-replacement-1.0.0.jar app.jar
USER app
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3000/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

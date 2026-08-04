FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Usuario no privilegiado (no root) para reducir el impacto de un compromiso.
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 8081
# Límite de memoria para caber holgadamente en instancias de 512 MB.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60.0", "-XX:MaxMetaspaceSize=128m", "-XX:+UseSerialGC", "-jar", "app.jar"]

# Stage 1: Build stage
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Copy maven wrapper configurations and pom.xml
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Grant execute permission for the maven wrapper script
RUN chmod +x mvnw

# Resolve dependencies to cache them in a separate Docker layer
RUN ./mvnw dependency:go-offline -B

# Copy source code and build the executable JAR
COPY src ./src
RUN ./mvnw package -DskipTests -B

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Expose the default Spring Boot port
EXPOSE 8080

# Copy the compiled JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]

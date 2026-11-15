# ---------- Build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
# tải dependency trước để tận dụng cache khi chỉ sửa code
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package && cp target/*.jar /app.jar

# ---------- Run ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app app \
    && mkdir -p /app/uploads && chown -R app:app /app
COPY --from=build /app.jar /app/app.jar
USER app

ENV TZ=Asia/Ho_Chi_Minh \
    UPLOAD_DIR=/app/uploads \
    JAVA_OPTS="-Xms128m -Xmx512m"
VOLUME /app/uploads
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]

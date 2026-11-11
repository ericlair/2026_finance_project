# 1단계: 빌드
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
# 윈도우에서 받은 mvnw의 줄바꿈(CRLF)을 리눅스용(LF)으로 바꾼다
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
COPY src src
# Docker에서는 비밀 값이 없는 예시 설정을 기본 설정으로 쓴다 (실제 값은 환경변수로 받는다)
RUN cp src/main/resources/application-example.properties src/main/resources/application.properties
RUN ./mvnw -B -DskipTests package

# 2단계: 실행
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Duser.timezone=Asia/Seoul", "-jar", "app.jar"]
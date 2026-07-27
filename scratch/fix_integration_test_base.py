import os

file_path = "backend/src/test/java/com/telecareplus/IntegrationTestBase.java"
if os.path.exists(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    content = content.replace("import com.redis.testcontainers.RedisContainer;", "import org.testcontainers.containers.GenericContainer;\nimport org.testcontainers.utility.DockerImageName;")
    content = content.replace("new RedisContainer(DockerImageName.parse(\"redis:7-alpine\"));", "new GenericContainer<>(DockerImageName.parse(\"redis:7-alpine\")).withExposedPorts(6379);")
    content = content.replace("public static final RedisContainer REDIS_CONTAINER", "public static final GenericContainer<?> REDIS_CONTAINER")
    content = content.replace("public static RedisContainer REDIS_CONTAINER", "public static GenericContainer<?> REDIS_CONTAINER")
    content = content.replace("registry.add(\"spring.data.redis.host\", REDIS_CONTAINER::getHost);", "registry.add(\"spring.data.redis.host\", REDIS_CONTAINER::getHost);\n        registry.add(\"spring.data.redis.port\", () -> REDIS_CONTAINER.getMappedPort(6379));")
    content = content.replace("registry.add(\"spring.data.redis.port\", REDIS_CONTAINER::getFirstMappedPort);", "") # Clean up old mapping

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Fixed IntegrationTestBase.java for RedisContainer")

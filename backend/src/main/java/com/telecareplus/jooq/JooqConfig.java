package com.telecareplus.jooq;

import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import javax.sql.DataSource;

/**
 * Configuration class that creates a {@link DSLContext} bean for jOOQ.
 * The same {@link DataSource} used by Spring Data JPA/Hibernate is shared,
 * ensuring a single connection pool (HikariCP) for the entire application.
 */
@Configuration
public class JooqConfig {

    private final DataSource dataSource;

    @Autowired
    public JooqConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Creates a jOOQ {@link DSLContext} using the shared {@link DataSource}.
     * The DSL uses the default SQL dialect for PostgreSQL.
     */
    @Bean
    public DSLContext dslContext() {
        return DSL.using(dataSource, org.jooq.SQLDialect.POSTGRES);
    }
}

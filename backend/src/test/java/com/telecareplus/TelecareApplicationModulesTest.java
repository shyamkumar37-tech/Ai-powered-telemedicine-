package com.telecareplus;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

class TelecareApplicationModulesTest {

    ApplicationModules modules = ApplicationModules.of(TelecareplusApplication.class);

    @Test
    void verifyModulithStructure() {
        // This will automatically fail the build if any cyclic dependencies exist
        // or if a module accesses another module's internal classes directly.
        modules.verify();
    }

    @Test
    void createModuleDocumentation() {
        // Generates plantuml diagrams and documentation based on the current module structure
        new Documenter(modules)
            .writeModulesAsPlantUml()
            .writeIndividualModulesAsPlantUml();
    }
}

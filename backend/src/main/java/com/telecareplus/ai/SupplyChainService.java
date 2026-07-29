package com.telecareplus.ai;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SupplyChainService {
    public List<String> get30DayProjection() {
        return List.of("proj1", "proj2");
    }
}

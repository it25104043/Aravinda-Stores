package com.lpg.retail.controller;

import com.lpg.retail.dto.Views;
import com.lpg.retail.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService service;

    @GetMapping("/sales")
    public Views.SalesReport sales(@RequestParam LocalDate start, @RequestParam LocalDate end) {
        return service.sales(start, end);
    }

    @GetMapping("/summary")
    public Views.Summary summary() {
        return service.summary();
    }

    @GetMapping("/payments")
    public List<Views.Payment> payments() {
        return service.payments();
    }

    @GetMapping("/stock")
    public List<Views.Stock> stock() {
        return service.stock();
    }

    @GetMapping("/low-stock")
    public List<Views.Stock> low() {
        return service.lowStock();
    }

    @GetMapping("/movements")
    public List<Views.Movement> movements(@RequestParam(defaultValue = "0") int page) {
        return service.movements(page);
    }

    @GetMapping("/audit")
    public List<Views.Audit> audit(@RequestParam(defaultValue = "0") int page) {
        return service.audit(page);
    }
}

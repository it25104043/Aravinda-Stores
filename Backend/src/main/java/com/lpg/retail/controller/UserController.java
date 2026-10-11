package com.lpg.retail.controller;

import com.lpg.retail.dto.*;
import com.lpg.retail.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService service;

    @PostMapping("/me/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody Requests.ChangePassword r,
            @RequestHeader("Idempotency-Key") String key) {
        service.changePassword(r, key);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Views.User register(@Valid @RequestBody Requests.Register r) {
        return service.register(r);
    }

    @PostMapping("/login")
    public Views.Login login(@Valid @RequestBody Requests.Login r) {
        return service.login(r);
    }

    @GetMapping("/me")
    public Views.User me() {
        return service.me();
    }

    @PutMapping("/me")
    public Views.User contact(@Valid @RequestBody Requests.Contact r) {
        return service.contact(r);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout() {
        service.logout();
    }

    @GetMapping("/staff")
    public List<Views.User> staff() {
        return service.staff();
    }

    @PostMapping("/staff")
    @ResponseStatus(HttpStatus.CREATED)
    public Views.User create(@Valid @RequestBody Requests.Staff r) {
        return service.createStaff(r);
    }

    @PutMapping("/staff/{id}")
    public Views.User access(@PathVariable Long id, @Valid @RequestBody Requests.StaffAccess r) {
        return service.access(id, r);
    }

    @GetMapping("/delivery-workers")
    public List<Views.User> workers() {
        return service.workers();
    }
}

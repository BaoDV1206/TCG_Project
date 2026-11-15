package com.tcgshop.web.admin;

import com.tcgshop.common.PageResponse;
import com.tcgshop.dto.RequestDtos.*;
import com.tcgshop.service.RequestService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin")
public class AdminRequestController {
    private final RequestService requestService;

    public AdminRequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    @GetMapping("/dashboard")
    public DashboardDto dashboard() {
        return requestService.dashboard();
    }

    @GetMapping("/requests")
    public PageResponse<RequestDto> list(@RequestParam(required = false) String type,
                                         @RequestParam(required = false) String status,
                                         @RequestParam(required = false) String q,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                         @RequestParam(required = false) Long userId,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        return requestService.adminList(type, status, q, from, to, userId, page, size);
    }

    @GetMapping("/requests/{id}")
    public RequestDto get(@PathVariable Long id) {
        return requestService.adminGet(id);
    }

    @PostMapping("/requests/{id}/transition")
    public RequestDto transition(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                 @Valid @RequestBody TransitionInput in) {
        return requestService.transition(jwt.getSubject(), id, in);
    }
}

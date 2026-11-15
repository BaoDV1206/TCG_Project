package com.tcgshop.web;

import com.tcgshop.common.PageResponse;
import com.tcgshop.config.JwtService;
import com.tcgshop.dto.RequestDtos.*;
import com.tcgshop.service.RequestService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Yêu cầu của người dùng đang đăng nhập */
@RestController
@RequestMapping("/api/requests")
public class RequestController {
    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping
    public RequestDto create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateRequestInput in) {
        return requestService.create(JwtService.uid(jwt), in);
    }

    @PostMapping("/proxy")
    public RequestDto createProxy(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ProxyRequestInput in) {
        return requestService.createProxy(JwtService.uid(jwt), in);
    }

    @GetMapping
    public PageResponse<RequestDto> list(@AuthenticationPrincipal Jwt jwt,
                                         @RequestParam(required = false) String type,
                                         @RequestParam(required = false) String status,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "10") int size) {
        return requestService.listMine(JwtService.uid(jwt), type, status, page, size);
    }

    @GetMapping("/summary")
    public RequestSummary summary(@AuthenticationPrincipal Jwt jwt) {
        return requestService.summary(JwtService.uid(jwt));
    }

    @GetMapping("/{id}")
    public RequestDto get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return requestService.getMine(JwtService.uid(jwt), id);
    }

    @PostMapping("/{id}/cancel")
    public RequestDto cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                             @RequestBody(required = false) Map<String, String> body) {
        return requestService.cancel(JwtService.uid(jwt), id, body == null ? null : body.get("reason"));
    }

    @PostMapping("/{id}/quote-response")
    public RequestDto respondQuote(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                   @Valid @RequestBody QuoteResponseInput in) {
        return requestService.respondQuote(JwtService.uid(jwt), id, in);
    }
}

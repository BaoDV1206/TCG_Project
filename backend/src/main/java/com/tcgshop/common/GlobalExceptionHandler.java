package com.tcgshop.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private ResponseEntity<Map<String, String>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, String>> handleApi(ApiException ex) {
        return body(ex.getStatus(), ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(f -> f.getDefaultMessage())
                .orElse("Dữ liệu không hợp lệ");
        return body(HttpStatus.BAD_REQUEST, msg);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, String>> handleBadInput(Exception ex) {
        return body(HttpStatus.BAD_REQUEST, "Dữ liệu gửi lên không đúng định dạng");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleIntegrity(DataIntegrityViolationException ex) {
        return body(HttpStatus.CONFLICT, "Dữ liệu đang được sử dụng hoặc bị trùng, không thể thực hiện");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleUpload(MaxUploadSizeExceededException ex) {
        return body(HttpStatus.BAD_REQUEST, "File quá lớn (tối đa 5MB)");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleDenied(AccessDeniedException ex) {
        return body(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, String>> handleNoResource(NoResourceFoundException ex) {
        return body(HttpStatus.NOT_FOUND, "Không tìm thấy");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleOther(Exception ex) {
        log.error("Unhandled error", ex);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Có lỗi xảy ra, vui lòng thử lại sau");
    }
}

package com.lpg.retail.exception;
public class ApiException extends RuntimeException {
    private final int status;
    public ApiException(int status,String message) {
        super(message);
        this.status=status;
    }
    public int getStatus() {
        return status;
    }
    public static ApiException missing() {
        return new ApiException(404,"Record not found");
    }
    public static void require(boolean condition,String message) {
        if(!condition)throw new ApiException(409,message);
    }
}

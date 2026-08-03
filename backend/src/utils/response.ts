export interface ApiResponse<T = unknown>{
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details? : unknown
    };
    message: string;
    meta? : {
        page?: number;
        limit?:number;
        total?:number;
        totalPages?:number;
    };
}


//Success response factory
export function successResponse<T>(
    data: T,
    message = 'Succes',
    meta?: ApiResponse<T>['meta']
): ApiResponse<T> {
    return  {
        success: true,
        data,
        message,
        meta
    };
}

//Error response factory 
export function errorResponse (
    message:string,
    code = 'INTERNAL_ERROR',
    details?: unknown
): ApiResponse {
    return {
        success: false,
        error: {
            code,
            message,
            details,
        },

        message,
    };
}
class ErrorSerializer {

    static serializeValidationError(data: Record<string, any>, typeParam: string): { code: string; source: { parameter: string }; detail: any; title: string } {
        const keys: string[] = Object.keys(data);
        let message: string = '';
        switch (typeParam) {

            case 'body':
                message = 'Invalid body parameter';
                break;
            case 'query':
                message = 'Invalid query parameter';
                break;
            default:
                message = '';

        }
        return {
            source: {
                parameter: keys[0]
            },
            code: message.replace(/ /g, '_').toLowerCase(),
            title: message,
            detail: data[keys[0]]
        };
    }

    static serializeValidationBodyErrors(data: Array<any>): { errors: Array<any> } {
        const errors: Array<any> = [];
        if (data) {
            for (let i: number = 0, { length } = data; i < length; i++) {
                errors.push(ErrorSerializer.serializeValidationError(data[i], 'body'));
            }
        }
        return {
            errors
        };
    }

    static serializeError(status: number,
                          message: string,): { errors: { detail: string; status: number }[] } {
        return {
            errors: [{
                status,
                detail: message
            }]
        };
    }

}

export default ErrorSerializer;

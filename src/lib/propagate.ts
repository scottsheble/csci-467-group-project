export default function propagate ( value: any | null | undefined, error: string ) {
    if ( value !== null && value !== undefined ) {
        return value;
    } else {
        throw new Error(error);
    }
}
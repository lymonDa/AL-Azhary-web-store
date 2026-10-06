import { IPreorder, IPreorderDocument, SafePreorderDto } from '../types/preorder.types';
/**
 * Projects a raw preorder document or POJO to a sanitized, public-safe DTO.
 * Guarantees no sensitive internals, stringifies ObjectIds, and formats dates to ISO.
 */
export declare function toSafePreorderDto(doc: IPreorder | IPreorderDocument, includeAdminNotes?: boolean): SafePreorderDto;

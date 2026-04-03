export interface CreateNote{
    title : string;
    content : string;
    color : string;
    category_id? : number | null;
}
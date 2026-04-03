export interface Note {
    id : number;
    title : string | null;
    color : string | null;
    content : string | null;
    date : string;
    isFavorite : boolean;
    category_id : number | null;
    category? : {
        name : string;
        description : string | null;
    } | null
}

export interface NoteUpdate {
  title?: string;
  color?: string;
  content?: string;
  date?: string;
  isFavorite?: boolean;
  category_id?: number | null;    
}
import { Link } from "react-router-dom";
import { FolderPlus, Images, User } from "lucide-react";

interface Props {
    onColorSelect: (color: string) => void;
    onOpenCategoryForm: () => void;
    userName: string;
    userId: string;
}

const colors = ["#3B82F6", "#F97316", "#EF4444", "#22C55E", "#A855F7"];

export const Navbar = ({ onColorSelect, onOpenCategoryForm, userName, userId }: Props) => {
    return (
        <nav className="px-5 py-10 flex flex-col justify-between border-r border-black h-full w-fit text-center">
            <div className="flex flex-col gap-20">
                <h1 className="font-semibold text-lg">Docknotes</h1>
                <ul className="flex flex-col items-center gap-4">
                    {colors.map((color) => (
                        <li key={color}>
                            <button
                                className="w-6 h-6 rounded-full cursor-pointer"
                                style={{ backgroundColor: color }}
                                onClick={() => onColorSelect(color)}
                            />
                        </li>
                    ))}
                </ul>
                <button
                    onClick={onOpenCategoryForm}
                    className="flex flex-col items-center gap-1 cursor-pointer text-black/60 hover:text-black"
                >
                    <FolderPlus className="w-6 h-6" />
                    <span className="text-xs">Catégorie</span>
                </button>
                <Link
                    to="/gallery"
                    className="flex flex-col items-center gap-1 text-black/60 hover:text-black"
                >
                    <Images className="w-6 h-6" />
                    <span className="text-xs">Galerie</span>
                </Link>
            </div>
            <Link
                to={`/profile/${userId}`}
                className="flex flex-col items-center gap-2 text-black/60 hover:text-black"
            >
                <User className="w-5 h-5" />
                <p className="text-xs truncate max-w-16">{userName}</p>
            </Link>
        </nav>
    )
}

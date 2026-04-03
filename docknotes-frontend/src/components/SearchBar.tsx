import { Search } from 'lucide-react';

interface Props {
    onSearch: (query: string) => void;
}

export const SearchBar = ({ onSearch }: Props) => {
    return (
        <div className='flex bg-zinc-300 rounded-full w-[70%] py-3 px-6 gap-4'>
            <Search className='w-7 h-7'/>
            <input
                type="text"
                placeholder='Search'
                onChange={(e) => onSearch(e.target.value)}
                className='placeholder:text-black placeholder:text-lg w-full outline-none bg-transparent'
            />
        </div>
    )
}
"use client";

import { SearchIcon } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { useClientsSearch } from "../../hooks/use-clients-search";

export const ClientSearchFilter = () => {
    const [inputValue, setInputValue] = useState("");
    const { setSearch } = useClientsSearch();

    const handleChange = (value: string) => {
        setInputValue(value);
        setSearch(value);
    };

    return (
        <div className="relative">
            <Input
                placeholder="Filtrer par nom"
                className="h-9 bg-white w-[200px] pl-7"
                value={inputValue}
                onChange={e => handleChange(e.target.value)}
            />
            <SearchIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
    )
}
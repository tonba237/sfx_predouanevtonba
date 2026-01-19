
import Image from "next/image";
import { Card, CardContent } from "./ui/card";


interface Props {
    title: string;
    description: string;
    image?: string;
};


export const EmptyState = ({
    title,
    description,
    image = "/empty.svg"
}: Props) => {
    return (
        <Card className="flex flex-col items-center justify-center">
            <Image src={image} alt="EmptyState" width={240} height={240} />
            <CardContent className="flex flex-col gap-y-6 max-w-md mx-auto text-center">
                <h6 className="text-lg font-medium">{title}</h6>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}
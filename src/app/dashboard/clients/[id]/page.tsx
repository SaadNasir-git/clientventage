import { ClientDetailView } from "./Main"

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
    const clientId = (await params).id

    return (
        <ClientDetailView clientId={clientId}/>
    )
}

export default page
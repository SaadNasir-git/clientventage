import { ProjectDetail } from './Main';

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
    const projectId = (await params).id;

    return (
        <ProjectDetail projectId={projectId}/>
    )
}

export default page
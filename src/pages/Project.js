import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../firebase/config';

function Project() {
    const [data, setData] = useState(null);
    const [newTodo, setNewTodo] = useState('');
    const { id } = useParams();

    const handleAddTodo = async () => {
        if (newTodo.trim()) {
            setNewTodo('');
            const newTodos = [...data.todos, { text: newTodo, completed: false }];
            setData({ ...data, todos: newTodos });
            const projectRef = doc(db, 'projects', id);
            await updateDoc(projectRef, { todos: newTodos });
            localStorage.setItem(`project-${id}`, JSON.stringify({ ...data, todos: newTodos }));
        }
    };

    const handleTodoCompletion = (index) => {
        const newTodos = [...data.todos];
        newTodos[index].completed = !newTodos[index].completed;
        setData({ ...data, todos: newTodos });
        localStorage.setItem(`project-${id}`, JSON.stringify(data));
    };

    const handleExportGist = async () => {
        if (!data) return;
        const finishedTodos = data.todos.filter(todo => todo.completed);

        const markdownContent = `# ${data.title}\n\n**Summary:** ${finishedTodos.length} / ${data.todos.length} completed\n\n` +
            '## Pending\n\n' +
            data.todos.filter(todo => !todo.completed).map(todo => `- [${todo.completed ? 'x' : ' '}] ${todo.text}`).join('\n') +
            '\n\n## Completed\n\n' +
            finishedTodos.map(todo => `- [${todo.completed ? 'x' : ' '}] ${todo.text}`).join('\n');

        const token = process.env.REACT_APP_GITHUB_TOKEN;
        const gistData = {
            description: `${data.title} Todo List`,
            public: false,
            files: {
                [`${data.title.replace(/\s+/g, '_')}.md`]: {
                    content: markdownContent,
                },
            },
        };

        try {
            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gistData),
            });

            const result = await response.json();
            if (response.ok) {
                window.open(result.html_url, '_blank');
            } else {
                alert(`Error creating gist: ${result.message}`);
            }
        } catch (error) {
            alert(`An error occurred: ${error.message}`);
        }
    };

    useEffect(() => {
        const fetchProject = async () => {
            const project = localStorage.getItem(`project-${id}`);
            if (project && project.user === auth.currentUser.uid) {
                setData(project);
            } else if (id) {
                const projectRef = doc(db, 'projects', id);
                const projectSnap = await getDoc(projectRef);
                if (projectSnap.exists() && projectSnap.data().user === auth.currentUser.uid) {
                    setData(projectSnap.data());
                    localStorage.setItem(`project-${id}`, JSON.stringify(projectSnap.data()));
                }
            }
        };

        fetchProject();
    }, [id]);


    return (
        <div className="container mx-auto p-4">
            {data ? (
                <>
                    <h1 className="text-2xl font-bold mb-4">{data?.title}</h1>

                    <div className="mb-4">
                        <input
                            type="text"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            className="border p-2 rounded mr-2"
                            placeholder="Add new todo"
                        />
                        <button
                            onClick={handleAddTodo}
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            Add
                        </button>
                        <button
                            onClick={handleExportGist}
                            className="bg-green-500 text-white px-4 py-2 rounded ml-2"
                        >
                            Export to Gist
                        </button>
                    </div>

                    <div className="space-y-2">
                        {data?.todos?.map((todo, index) => (
                            <div key={index} className="flex items-center p-3 border rounded">
                                <input
                                    type="checkbox"
                                    className="mr-3"
                                    checked={todo.completed}
                                    onChange={() => handleTodoCompletion(index)}
                                />
                                <span>{todo.text}</span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div>Project not found</div>
            )}
        </div>
    );
}

export default Project;

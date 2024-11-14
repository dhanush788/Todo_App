import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

function Home() {
    const [cards, setCards] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [todos, setTodos] = useState([{ text: '', completed: false }]);
    const [isEditing, setIsEditing] = useState(false);
    const [editCardId, setEditCardId] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [titleError, setTitleError] = useState(false);
    const navigate = useNavigate();

    const addOrUpdateCard = async () => {
        if (!newCardTitle.trim()) {
            setTitleError(true);
            return;
        }

        const cardData = {
            title: newCardTitle.trim(),
            user: auth.currentUser.uid,
            todos: todos.filter(todo => todo.text.trim() !== '') 
        };

        if (isEditing) {
            const cardRef = doc(db, 'projects', editCardId);
            await updateDoc(cardRef, cardData);
            setIsEditing(false);
            setEditCardId(null);
        } else {
            cardData.id = uuidv4();
            const projectRef = collection(db, 'projects');
            await addDoc(projectRef, cardData);
        }

        setNewCardTitle('');
        setTodos([{ text: '', completed: false }]);
        setIsModalOpen(false);
    };

    const editCard = (card) => {
        setIsEditing(true);
        setEditCardId(card.docId);
        setNewCardTitle(card.title);
        setTodos(card.todos || [{ text: '', completed: false }]);
        setIsModalOpen(true);
    };

    const deleteCard = async (cardId) => {
        const cardRef = doc(db, 'projects', cardId);
        await deleteDoc(cardRef);
    };

    useEffect(() => {
        const projectRef = collection(db, 'projects');
        const unsubscribe = onSnapshot(projectRef, (snapshot) => {
            const projects = snapshot.docs.filter((doc) => doc.data().user === auth.currentUser.uid).map((doc) => ({ docId: doc.id, ...doc.data() }));
            setCards(projects);
        });
        return () => unsubscribe();
    }, []);

    const toggleDropdown = (cardId) => {
        setDropdownOpen(dropdownOpen === cardId ? null : cardId);
    };

    const handleTodoChange = (index, value) => {
        const updatedTodos = [...todos];
        updatedTodos[index].text = value;
        setTodos(updatedTodos);
    };

    const addTodoField = () => {
        setTodos([...todos, { text: '', completed: false }]);
    };

    return (
        <div className="min-h-screen p-8 bg-gray-100">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <button
                onClick={() => { setIsModalOpen(true); setIsEditing(false); }}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow"
            >
                Add Project
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {cards.map((card) => (
                    <div
                        key={card.docId}
                        className="p-4 bg-white rounded-lg shadow relative cursor-pointer"
                        onClick={() => navigate(`/project/${card.docId}`)}
                    >
                        <h2 className="text-xl font-semibold">{card.title}</h2>
                        <ul>
                            {card.todos && card.todos.map((todo, idx) => (
                                <li key={idx} className="text-gray-700">
                                    • {todo.text}
                                </li>
                            ))}
                        </ul>

                        <div className="absolute top-2 right-2">
                            <button onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(card.docId);
                            }}
                                className="text-gray-600"
                            >
                                •••
                            </button>
                            {dropdownOpen === card.docId && (
                                <div className="absolute right-0 mt-2 w-28 bg-white rounded-md shadow-xl z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            editCard(card);
                                            setDropdownOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteCard(card.docId);
                                            setDropdownOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">
                            {isEditing ? 'Edit Project' : 'Add New Project'}
                        </h2>
                        <div>
                            <input
                                type="text"
                                placeholder="Project Title *"
                                value={newCardTitle}
                                onChange={(e) => {
                                    setNewCardTitle(e.target.value);
                                    setTitleError(false);
                                }}
                                className={`w-full mb-1 p-2 border rounded ${titleError ? 'border-red-500' : ''}`}
                                required
                            />
                            {titleError && (
                                <p className="text-red-500 text-sm mb-4">Project title is required</p>
                            )}
                        </div>
                        <div>
                            {todos.map((todo, idx) => (
                                <div key={idx} className="flex items-center mb-2">
                                    <input
                                        type="text"
                                        placeholder={`To-Do ${idx + 1}`}
                                        value={todo.text}
                                        onChange={(e) => handleTodoChange(idx, e.target.value)}
                                        className="w-full p-2 border rounded mr-2"
                                    />
                                    {idx === todos.length - 1 && (
                                        <button onClick={addTodoField} className="px-2 py-1 bg-gray-200 rounded">+</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addOrUpdateCard}
                                className="px-4 py-2 bg-blue-500 text-white rounded"
                            >
                                {isEditing ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;

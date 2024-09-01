import React, { useState, useEffect, useRef } from 'react';
import {
    generateSinglePagePlan,
    generateMultiplePagePlan,
    generateStylingPlan,
    generateApiPlan,
    generateSchema,
    modifySchema
} from '../utils/api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function Dashboard({ formData, onSubmit }) {
    const [loading, setLoading] = useState(true);
    const [apiResult, setApiResult] = useState(null);
    const [data, setData] = useState(formData);
    const [currentStep, setCurrentStep] = useState(1);
    const [editingApiIndex, setEditingApiIndex] = useState(-1);
    const [newApi, setNewApi] = useState({ name: '', endpoint: '', method: 'GET' });
    const [prompt, setPrompt] = useState('');
    const [showPromptDialog, setShowPromptDialog] = useState(false);
    const [error, setError] = useState(null);

    const [newPage, setNewPage] = useState({ name: '', purpose: '' }); // State for new page

    const tableRefs = useRef([]);

    useEffect(() => {
        const fetchPagePlan = async () => {
            setLoading(true);
            setError(null);
            try {
                if (data.appType === 'single') {
                    const result = await generateSinglePagePlan(data);
                    setApiResult(result);
                } else {
                    const result = await generateMultiplePagePlan(data);
                    setApiResult(result);
                }
            } catch (error) {
                console.error('Error generating project:', error);
                setError('Failed to generate page plan. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (currentStep === 1) {
            fetchPagePlan();
        }
    }, [currentStep, data]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'logo') {
            setData({ ...data, [name]: files[0] });
        } else {
            setData({ ...data, [name]: value });
        }
    };

    const handleColorChange = (colorName, value) => {
        const updatedColors = { ...apiResult.styling.colors, [colorName]: value };
        setApiResult({ ...apiResult, styling: { ...apiResult.styling, colors: updatedColors } });
    };

    const handlePageChange = (index, e) => {
        const { name, value } = e.target;
        const newPages = [...apiResult.pages];
        newPages[index][name] = value;
        setApiResult({ ...apiResult, pages: newPages });
    };

    const handleComponentChange = (pageIndex, componentIndex, e) => {
        const { value } = e.target;
        const newPages = [...apiResult.pages];
        newPages[pageIndex].components[componentIndex] = value;
        setApiResult({ ...apiResult, pages: newPages });
    };

    const handleDeleteComponent = (pageIndex, componentIndex) => {
        const newPages = [...apiResult.pages];
        newPages[pageIndex].components.splice(componentIndex, 1);
        setApiResult({ ...apiResult, pages: newPages });
    };

    const handleAddComponent = (pageIndex, newComponent) => {
        const newPages = [...apiResult.pages];
        newPages[pageIndex].components.push(newComponent);
        setApiResult({ ...apiResult, pages: newPages });
    };

    const handleAddPage = () => {
        if (newPage.name.trim() && newPage.purpose.trim()) {
            setApiResult({
                ...apiResult,
                pages: [...apiResult.pages, { name: newPage.name, purpose: newPage.purpose, components: [] }]
            });
            setNewPage({ name: '', purpose: '' }); // Clear the form after adding the page
        }
    };

    const handleDeletePage = (pageIndex) => {
        const newPages = [...apiResult.pages];
        newPages.splice(pageIndex, 1);
        setApiResult({ ...apiResult, pages: newPages });
    };

    const handleSave = () => {
        const combinedData = {
            ...data,
            pages: apiResult.pages,
            styling: apiResult.styling,
            apis: apiResult.apis,
            databaseSchema: apiResult.databaseSchema,
        };
        onSubmit(combinedData);
    };

    const handleApiChange = (index, e) => {
        const { name, value } = e.target;
        const newApis = [...apiResult.apis];
        newApis[index][name] = value;
        setApiResult({ ...apiResult, apis: newApis });
    };

    const handleDeleteApi = (index) => {
        const newApis = [...apiResult.apis];
        newApis.splice(index, 1);
        setApiResult({ ...apiResult, apis: newApis });
    };

    const handleAddApi = () => {
        setApiResult({ ...apiResult, apis: [...apiResult.apis, newApi] });
        setNewApi({ name: '', endpoint: '', method: 'GET' });
    };

    const getTableCoordinates = (tableIndex) => {
        const tableElement = tableRefs.current[tableIndex];
        if (!tableElement) return { x: 0, y: 0 };
        const rect = tableElement.getBoundingClientRect();
        return {
            x: rect.left + window.scrollX + rect.width / 2,
            y: rect.top + window.scrollY + rect.height / 2,
        };
    };

    const handleOpenPromptDialog = () => {
        setShowPromptDialog(true);
    };

    const handleClosePromptDialog = () => {
        setShowPromptDialog(false);
        setPrompt('');
    };

    const handleSubmitPrompt = async () => {
        if (prompt.trim() === '') return;

        try {
            const result = await modifySchema(apiResult.databaseSchema, prompt);
            setApiResult({ ...apiResult, databaseSchema: result.databaseSchema });
        } catch (error) {
            console.error('Error modifying schema:', error);
        } finally {
            handleClosePromptDialog();
        }
    };

    const handleNextStep = async () => {
        setCurrentStep(currentStep + 1);
        setLoading(true);
        try {
            switch (currentStep + 1) {
                case 2: {
                    const result = await generateStylingPlan(data);
                    setApiResult({ ...apiResult, styling: result });
                    break;
                }
                case 3: {
                    const result = await generateApiPlan(`Purpose: ${data.purpose}, Page details: ${JSON.stringify(apiResult.pages)}`);
                    setApiResult({ ...apiResult, apis: result });
                    break;
                }
                case 4: {
                    const result = await generateSchema(`Purpose: ${data.purpose}, API details: ${JSON.stringify(apiResult.apis)}`);
                    setApiResult({ ...apiResult, databaseSchema: result });
                    break;
                }
                default:
                    break;
            }
        } catch (error) {
            console.error('Error progressing to next step:', error);
            setError('Failed to progress to the next step. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            switch (currentStep) {
                case 1: {
                    if (data.appType === 'single') {
                        const result = await generateSinglePagePlan(data);
                        setApiResult(result);
                    } else {
                        const result = await generateMultiplePagePlan(data);
                        setApiResult(result);
                    }
                    break;
                }
                case 2: {
                    const result = await generateStylingPlan(data.colors + " Try different shades");
                    setApiResult({ ...apiResult, styling: result });
                    break;
                }
                case 3: {
                    const result = await generateApiPlan(`Purpose: ${data.purpose}, Page details: ${JSON.stringify(apiResult.pages)}`);
                    setApiResult({ ...apiResult, apis: result });
                    break;
                }
                case 4: {
                    const result = await generateSchema(`Purpose: ${data.purpose}, API details: ${JSON.stringify(apiResult.apis)}`);
                    setApiResult({ ...apiResult, databaseSchema: result });
                    break;
                }
                default:
                    break;
            }
        } catch (error) {
            console.error('Error regenerating step:', error);
            setError('Failed to regenerate. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = (result, pageIndex) => {
        if (!result.destination) return;

        const newPages = [...apiResult.pages];
        const [reorderedItem] = newPages[pageIndex].components.splice(result.source.index, 1);
        newPages[pageIndex].components.splice(result.destination.index, 0, reorderedItem);

        setApiResult({ ...apiResult, pages: newPages });
    };

    useEffect(() => {
        if (tableRefs.current.length > 0) {
            setApiResult({ ...apiResult });
        }
    }, [tableRefs.current]);

    return (
        <div className="dashboard">
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="space-y-8">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 text-red-800 p-4 rounded">
                            <p>{error}</p>
                            <button onClick={handleRegenerate} className="btn mt-2">
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Page Plan Section */}
                    {currentStep === 1 && apiResult && !error && (
                        <div className="p-6 bg-white shadow-md rounded-lg">
                            <h2 className="text-2xl font-bold mb-4">Review and Edit Your Page Plan</h2>
                            {apiResult.pages.map((page, pageIndex) => (
                                <div key={pageIndex} className="mb-4 p-4 bg-gray-100 rounded">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 mr-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={page.name}
                                                onChange={(e) => handlePageChange(pageIndex, e)}
                                                className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Page Purpose</label>
                                            <textarea
                                                name="purpose"
                                                value={page.purpose}
                                                onChange={(e) => handlePageChange(pageIndex, e)}
                                                className="border border-gray-300 p-2 w-full rounded h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            ></textarea>


                                        </div>
                                        <button
                                            onClick={() => handleDeletePage(pageIndex)}
                                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition duration-200 flex items-center justify-center"
                                            aria-label="Delete Page"
                                        >
                                            ✕
                                        </button>

                                    </div>
                                    <label className="block mb-2">Components</label>
                                    <DragDropContext onDragEnd={(result) => onDragEnd(result, pageIndex)}>
                                        <Droppable droppableId={`droppable-${pageIndex}`}>
                                            {(provided) => (
                                                <div
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    className="space-y-2"
                                                >
                                                    {page.components.map((component, componentIndex) => (
                                                        <Draggable
                                                            key={componentIndex}
                                                            draggableId={`draggable-${pageIndex}-${componentIndex}`}
                                                            index={componentIndex}
                                                        >
                                                            {(provided) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className="flex items-center space-x-2 mb-2 bg-white p-2 rounded shadow"
                                                                >
                                                                    <input
                                                                        type="text"
                                                                        value={component}
                                                                        onChange={(e) =>
                                                                            handleComponentChange(
                                                                                pageIndex,
                                                                                componentIndex,
                                                                                e
                                                                            )
                                                                        }
                                                                        className="border p-2 rounded w-full"
                                                                    />
                                                                    <button
                                                                        onClick={() =>
                                                                            handleDeleteComponent(
                                                                                pageIndex,
                                                                                componentIndex
                                                                            )
                                                                        }
                                                                        className="btn bg-red-500 text-white"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                    <div className="flex items-center space-x-2 mb-4">
                                        <input
                                            type="text"
                                            name={`newComponent${pageIndex}`}
                                            placeholder="New Component"
                                            className="border p-2 rounded w-full"
                                        />
                                        <button
                                            onClick={() =>
                                                handleAddComponent(
                                                    pageIndex,
                                                    document.querySelector(
                                                        `input[name="newComponent${pageIndex}"]`
                                                    ).value
                                                )
                                            }
                                            className="btn"
                                        >
                                            Add Component
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {/* Add Page Form */}
                            <div className="p-4 bg-gray-100 rounded mb-4">
                                <h3 className="text-lg font-bold mb-2">Add New Page</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
                                    <input
                                        type="text"
                                        name="pageName"
                                        value={newPage.name}
                                        onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                                        className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Page Purpose</label>
                                    <textarea
                                        name="pagePurpose"
                                        value={newPage.purpose}
                                        onChange={(e) => setNewPage({ ...newPage, purpose: e.target.value })}
                                        className="border border-gray-300 p-2 w-full rounded h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    ></textarea>
                                </div>
                                <button
                                    onClick={handleAddPage}
                                    className="btn bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-200"
                                >
                                    Add Page
                                </button>
                            </div>

                            <div className="flex space-x-4">
                                <button onClick={handleNextStep} className="btn">Continue to Styling</button>
                                <button onClick={handleRegenerate} className="btn">Regenerate Page Plan</button>
                            </div>
                        </div>
                    )}

                    {/* Styling Section */}
                    {currentStep === 2 && apiResult && !error && (
                        <div className="p-6 bg-white shadow-md rounded-lg">
                            <h2 className="text-2xl font-bold mb-4">Review and Edit Styling Details</h2>
                            {apiResult.styling && (
                                <div className="p-4 bg-gray-100 rounded">
                                    {Object.keys(apiResult.styling.colors).map((colorName) => (
                                        <div key={colorName} className="mb-4 flex items-center">
                                            <span className="font-bold mr-2">{colorName}:</span>
                                            <div
                                                className="w-10 h-10 rounded-full border-2 border-gray-300 mr-2"
                                                style={{ backgroundColor: apiResult.styling.colors[colorName] }}
                                            ></div>
                                            <input
                                                type="color"
                                                value={apiResult.styling.colors[colorName]}
                                                onChange={(e) => handleColorChange(colorName, e.target.value)}
                                                className="border-2 border-gray-300 rounded-lg mr-2"
                                            />
                                            <input
                                                type="text"
                                                value={apiResult.styling.colors[colorName]}
                                                onChange={(e) => handleColorChange(colorName, e.target.value)}
                                                className="border p-2 rounded"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex space-x-4">
                                <button onClick={handleNextStep} className="btn">Continue to API Generation</button>
                                <button onClick={handleRegenerate} className="btn">Regenerate Styling</button>
                            </div>
                        </div>
                    )}

                    {/* API Section */}
                    {currentStep === 3 && apiResult && !error && (
                        <div className="p-6 bg-white shadow-md rounded-lg">
                            <h2 className="text-2xl font-bold mb-4">Review and Edit API Details</h2>
                            {apiResult.apis && (
                                <div className="p-4 bg-gray-100 rounded">
                                    {apiResult.apis.map((api, index) => (
                                        <div key={index} className="mb-4">
                                            {editingApiIndex === index ? (
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={api.name}
                                                        onChange={(e) => handleApiChange(index, e)}
                                                        className="border p-2 rounded"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="endpoint"
                                                        value={api.endpoint}
                                                        onChange={(e) => handleApiChange(index, e)}
                                                        className="border p-2 rounded"
                                                    />
                                                    <select
                                                        name="method"
                                                        value={api.method}
                                                        onChange={(e) => handleApiChange(index, e)}
                                                        className="border p-2 rounded"
                                                    >
                                                        <option value="GET">GET</option>
                                                        <option value="POST">POST</option>
                                                        <option value="PUT">PUT</option>
                                                        <option value="DELETE">DELETE</option>
                                                    </select>
                                                    <button onClick={() => setEditingApiIndex(-1)} className="btn">Save</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-bold">{api.name}:</span> {api.method} {api.endpoint}
                                                    <button onClick={() => setEditingApiIndex(index)} className="btn">Edit</button>
                                                    <button onClick={() => handleDeleteApi(index)} className="btn">Delete</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="mt-4">
                                        <h4 className="font-bold mb-2">Add New API</h4>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                name="name"
                                                value={newApi.name}
                                                onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                                                placeholder="API Name"
                                                className="border p-2 rounded"
                                            />
                                            <input
                                                type="text"
                                                name="endpoint"
                                                value={newApi.endpoint}
                                                onChange={(e) => setNewApi({ ...newApi, endpoint: e.target.value })}
                                                placeholder="API Endpoint"
                                                className="border p-2 rounded"
                                            />
                                            <select
                                                name="method"
                                                value={newApi.method}
                                                onChange={(e) => setNewApi({ ...newApi, method: e.target.value })}
                                                className="border p-2 rounded"
                                            >
                                                <option value="GET">GET</option>
                                                <option value="POST">POST</option>
                                                <option value="PUT">PUT</option>
                                                <option value="DELETE">DELETE</option>
                                            </select>
                                            <button onClick={handleAddApi} className="btn">Add API</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex space-x-4">
                                <button onClick={handleNextStep} className="btn">Continue to Schema Generation</button>
                                <button onClick={handleRegenerate} className="btn">Regenerate APIs</button>
                            </div>
                        </div>
                    )}

                    {/* Schema Section with Full Review */}
                    {currentStep === 4 && apiResult && !error && (
                        <div className="p-6 bg-white shadow-md rounded-lg">
                            <h2 className="text-2xl font-bold mb-4">Review All Details and Edit Database Schema</h2>
                            {/* Pages Review */}
                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-4">Page Plan</h3>
                                {apiResult.pages.map((page, pageIndex) => (
                                    <div key={pageIndex} className="mb-4 p-4 bg-gray-100 rounded">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1 mr-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={page.name}
                                                    onChange={(e) => handlePageChange(pageIndex, e)}
                                                    className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Page Purpose</label>
                                                <textarea
                                                    name="purpose"
                                                    value={page.purpose}
                                                    onChange={(e) => handlePageChange(pageIndex, e)}
                                                    className="border border-gray-300 p-2 w-full rounded h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                ></textarea>


                                            </div>
                                            <button
                                                onClick={() => handleDeletePage(pageIndex)}
                                                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition duration-200 flex items-center justify-center"
                                                aria-label="Delete Page"
                                            >
                                                ✕
                                            </button>

                                        </div>

                                        <label className="block mb-2">Components</label>
                                        <DragDropContext onDragEnd={(result) => onDragEnd(result, pageIndex)}>
                                            <Droppable droppableId={`droppable-${pageIndex}`}>
                                                {(provided) => (
                                                    <div
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className="space-y-2"
                                                    >
                                                        {page.components.map((component, componentIndex) => (
                                                            <Draggable
                                                                key={componentIndex}
                                                                draggableId={`draggable-${pageIndex}-${componentIndex}`}
                                                                index={componentIndex}
                                                            >
                                                                {(provided) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className="flex items-center space-x-2 mb-2 bg-white p-2 rounded shadow"
                                                                    >
                                                                        <input
                                                                            type="text"
                                                                            value={component}
                                                                            onChange={(e) =>
                                                                                handleComponentChange(
                                                                                    pageIndex,
                                                                                    componentIndex,
                                                                                    e
                                                                                )
                                                                            }
                                                                            className="border p-2 rounded w-full"
                                                                        />
                                                                        <button
                                                                            onClick={() =>
                                                                                handleDeleteComponent(
                                                                                    pageIndex,
                                                                                    componentIndex
                                                                                )
                                                                            }
                                                                            className="btn bg-red-500 text-white"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </DragDropContext>
                                        <div className="flex items-center space-x-2 mb-4">
                                            <input
                                                type="text"
                                                name={`newComponent${pageIndex}`}
                                                placeholder="New Component"
                                                className="border p-2 rounded w-full"
                                            />
                                            <button
                                                onClick={() =>
                                                    handleAddComponent(
                                                        pageIndex,
                                                        document.querySelector(
                                                            `input[name="newComponent${pageIndex}"]`
                                                        ).value
                                                    )
                                                }
                                                className="btn"
                                            >
                                                Add Component
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Styling Review */}
                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-4">Styling Details</h3>
                                {apiResult.styling && (
                                    <div className="p-4 bg-gray-100 rounded">
                                        {Object.keys(apiResult.styling.colors).map((colorName) => (
                                            <div key={colorName} className="mb-4 flex items-center">
                                                <span className="font-bold mr-2">{colorName}:</span>
                                                <div
                                                    className="w-10 h-10 rounded-full border-2 border-gray-300 mr-2"
                                                    style={{ backgroundColor: apiResult.styling.colors[colorName] }}
                                                ></div>
                                                <input
                                                    type="color"
                                                    value={apiResult.styling.colors[colorName]}
                                                    onChange={(e) => handleColorChange(colorName, e.target.value)}
                                                    className="border-2 border-gray-300 rounded-lg mr-2"
                                                />
                                                <input
                                                    type="text"
                                                    value={apiResult.styling.colors[colorName]}
                                                    onChange={(e) => handleColorChange(colorName, e.target.value)}
                                                    className="border p-2 rounded"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* APIs Review */}
                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-4">API Details</h3>
                                {apiResult.apis && (
                                    <div className="p-4 bg-gray-100 rounded">
                                        {apiResult.apis.map((api, index) => (
                                            <div key={index} className="mb-4">
                                                {editingApiIndex === index ? (
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={api.name}
                                                            onChange={(e) => handleApiChange(index, e)}
                                                            className="border p-2 rounded"
                                                        />
                                                        <input
                                                            type="text"
                                                            name="endpoint"
                                                            value={api.endpoint}
                                                            onChange={(e) => handleApiChange(index, e)}
                                                            className="border p-2 rounded"
                                                        />
                                                        <select
                                                            name="method"
                                                            value={api.method}
                                                            onChange={(e) => handleApiChange(index, e)}
                                                            className="border p-2 rounded"
                                                        >
                                                            <option value="GET">GET</option>
                                                            <option value="POST">POST</option>
                                                            <option value="PUT">PUT</option>
                                                            <option value="DELETE">DELETE</option>
                                                        </select>
                                                        <button onClick={() => setEditingApiIndex(-1)} className="btn">Save</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-bold">{api.name}:</span> {api.method} {api.endpoint}
                                                        <button onClick={() => setEditingApiIndex(index)} className="btn">Edit</button>
                                                        <button onClick={() => handleDeleteApi(index)} className="btn">Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <div className="mt-4">
                                            <h4 className="font-bold mb-2">Add New API</h4>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={newApi.name}
                                                    onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                                                    placeholder="API Name"
                                                    className="border p-2 rounded"
                                                />
                                                <input
                                                    type="text"
                                                    name="endpoint"
                                                    value={newApi.endpoint}
                                                    onChange={(e) => setNewApi({ ...newApi, endpoint: e.target.value })}
                                                    placeholder="API Endpoint"
                                                    className="border p-2 rounded"
                                                />
                                                <select
                                                    name="method"
                                                    value={newApi.method}
                                                    onChange={(e) => setNewApi({ ...newApi, method: e.target.value })}
                                                    className="border p-2 rounded"
                                                >
                                                    <option value="GET">GET</option>
                                                    <option value="POST">POST</option>
                                                    <option value="PUT">PUT</option>
                                                    <option value="DELETE">DELETE</option>
                                                </select>
                                                <button onClick={handleAddApi} className="btn">Add API</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Schema Review */}
                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-4">Database Schema</h3>
                                <button onClick={handleOpenPromptDialog} className="btn mb-4">Modify Schema</button>
                                {apiResult.databaseSchema && (
                                    <div className="relative p-4 bg-gray-100 rounded overflow-hidden" style={{ minHeight: '800px' }}>
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                            {apiResult.databaseSchema.flatMap((table, tableIndex) =>
                                                table.relationships.map((relationship, relIndex) => {
                                                    const from = getTableCoordinates(tableIndex);
                                                    const to = getTableCoordinates(
                                                        apiResult.databaseSchema.findIndex(t => t.tableName === relationship.relatedTable)
                                                    );
                                                    return (
                                                        <line
                                                            key={`rel-${tableIndex}-${relIndex}`}
                                                            x1={from.x}
                                                            y1={from.y}
                                                            x2={to.x}
                                                            y2={to.y}
                                                            stroke="black"
                                                            strokeWidth="2"
                                                        />
                                                    );
                                                })
                                            )}
                                        </svg>
                                        <div className="flex flex-col items-center">
                                            {apiResult.databaseSchema.map((table, tableIndex) => (
                                                <div
                                                    key={tableIndex}
                                                    ref={(el) => (tableRefs.current[tableIndex] = el)}
                                                    className="relative m-4 p-4 bg-white shadow rounded"
                                                    style={{ width: '300px' }}
                                                >
                                                    <h4 className="font-bold">{table.tableName}</h4>
                                                    <table className="table-auto w-full bg-white">
                                                        <thead>
                                                            <tr>
                                                                <th className="px-4 py-2 bg-white">Column</th>
                                                                <th className="px-4 py-2 bg-white">Type</th>
                                                                <th className="px-4 py-2 bg-white">Keys</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {table.columns.map((column, colIndex) => (
                                                                <tr key={colIndex} className="bg-white">
                                                                    <td className="border px-4 py-2">{column.name}</td>
                                                                    <td className="border px-4 py-2">{column.type}</td>
                                                                    <td className="border px-4 py-2">
                                                                        {column.primaryKey && '[PK]'}{' '}
                                                                        {column.foreignKey && `[FK: ${column.foreignKey.table}.${column.foreignKey.column}]`}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-4">
                                <button onClick={handleSave} className="btn">Save and Proceed</button>
                                <button onClick={handleRegenerate} className="btn">Regenerate Schema</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showPromptDialog && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg">
                        <h3 className="text-xl font-bold mb-4">Modify Database Schema</h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="border p-2 w-full mb-4 rounded"
                            rows="4"
                            placeholder="Enter your prompt here"
                        ></textarea>
                        <div className="flex justify-end space-x-2">
                            <button onClick={handleClosePromptDialog} className="btn">Cancel</button>
                            <button onClick={handleSubmitPrompt} className="btn">Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useCallback, useState } from 'react';
import FontAwesome from 'react-fontawesome';
import { useDropzone } from 'react-dropzone';
import { parseBIFToGraph } from './BIFParser';
import ScaleLoader from 'react-spinners/ScaleLoader';
import DefaultFileSelect from './DefaultFileSelect';
import './fileUploader.css'

const FileUploader = props => {
    
    /** To keep track of the state of the upload component */
    const [ status, setStatus ] = useState('ready');
    const [ error, setError ] = useState(null);

    /**
     * When the user drops or opens a file from their own computer.
     * Parses the content and sends a callback to the App-component
     */
    const onDrop = useCallback(acceptedFiles => {
        setStatus('parsing')
        const reader = new FileReader()

        reader.onabort = () => console.log('File reading of ' + acceptedFiles + ' aborted!')
        reader.onerror = () => console.log('File reading of ' + acceptedFiles + ' failed!')
        reader.onload = () => {
            try {
                const binaryStr = reader.result
                const graphObject = parseBIFToGraph(binaryStr);
                props.callback(graphObject)
            } catch (err) {
                setError('Error parsing file: ' + err.message)
                setStatus('ready');
            }
        };

        acceptedFiles.forEach(file => reader.readAsBinaryString(file))
    }, [props]);

    /**
     * Using one of the default example files (asia, alarm, etc.)
     */
    const useDefaultFile = fileContent => {
        setStatus('parsing')
        try {
            const graphObject = parseBIFToGraph(fileContent);
            props.callback(graphObject);
        } catch (err) {
            setError("Error parsing file: " + err.message)
            setStatus('ready');
        }
    }
    
    /** Configuration props for the dropZone component */
    const { isDragActive, getRootProps, getInputProps, isDragReject } = useDropzone({
        onDrop,
        minSize: 0,
        noDrop: status === 'parsing',
        noClick: status === 'parsing',
        multiple: false,
        noKeyboard: true,
    });

    const spinner = <ScaleLoader height={100} width={8} margin={"5px"} color={'lightblue'} loading={status === 'parsing'} />

    return (
        <div className="flex-column">
            <div className="file-upload-container">
                <div {...getRootProps({className: `file-upload ${status === 'parsing' ? 'cursor-wait' : ''}`})}>
                <input {...getInputProps()} />
                    { status === 'ready' && !isDragActive && <FontAwesome className="upload-icon" name="upload"/> }
                    { status === 'ready' && isDragActive && !isDragReject && <FontAwesome className="release-icon" name="check-circle" />}
                    { status === 'ready' && (isDragActive ? "Drop it!" : "Drag to upload your BIF-file")}
                    { spinner }
                </div>
                { error && <p className="upload-error-label"> {error} </p>}
            </div>
            <DefaultFileSelect callback={useDefaultFile}/>
        </div>
    );
};

export default FileUploader;
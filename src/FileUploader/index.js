import React, { useCallback, useState } from 'react';
import FontAwesome from 'react-fontawesome';
import { useDropzone } from 'react-dropzone';
import { parseBIFToGraph } from './BIFParser';
import ScaleLoader from 'react-spinners/ScaleLoader';
import './fileUploader.css'



const FileUploader = props => {
    
    const [ status, setStatus ] = useState('ready');

    const onDrop = useCallback(acceptedFiles => {
        setStatus('parsing')
        const reader = new FileReader()

        reader.onabort = () => console.log('File reading of ' + acceptedFiles + ' aborted!')
        reader.onerror = () => console.log('File reading of ' + acceptedFiles + ' failed!')
        reader.onload = () => {
            const binaryStr = reader.result
            const graphObject = parseBIFToGraph(binaryStr);
            //TODO: Error handling
            props.callback(graphObject)
        };

        acceptedFiles.forEach(file => reader.readAsBinaryString(file))
    }, [props]);
    
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
        <div className="file-upload-container">
            <div {...getRootProps({className: `file-upload ${status === 'parsing' ? 'cursor-wait' : ''}`})}>
            <input {...getInputProps()} />
                { status === 'ready' && !isDragActive && <FontAwesome className="upload-icon" name="upload"/> }
                { status === 'ready' && isDragActive && !isDragReject && <FontAwesome className="release-icon" name="check-circle" />}
                { status === 'ready' && (isDragActive ? "Drop it!" : "Drag to upload your BIF-file")}
                { spinner }
            </div>
        </div>
    );
};

export default FileUploader;
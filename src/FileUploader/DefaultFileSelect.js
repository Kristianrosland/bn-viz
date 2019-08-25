import React from 'react';
import asia from './exampleNetworks/asia.bif';
import alarm from './exampleNetworks/alarm.bif';
import child from './exampleNetworks/child.bif';

const files = {
    'asia': asia,
    'alarm': alarm,
    'child': child
}

const DefaultFileSelect = ({ callback }) => {

    const openFile = network => {
        const file = files[network];
		const rawFile = new XMLHttpRequest();
		rawFile.open("GET", file, false);
		rawFile.onreadystatechange = () => {
			if (rawFile.readyState === 4) {
				if (rawFile.status === 200 || rawFile.status === 0) {
					const allText = rawFile.responseText;
					callback(allText);
				}
			}
		};
		rawFile.send(null);
	};

    const availableNetworks = Object.keys(files); //[ 'asia', 'alarm', 'child' ];

    return (
        <div className="default-file-select-wrapper">
            <div className="example-networks-header">..or use an example network</div>
            { availableNetworks.map(network => {
                return (
                    <div className="example-network" key={network} onClick={() => openFile(network)}>
                        { network }
                    </div>
                );
            })}
        </div>
    );
};

export default DefaultFileSelect;
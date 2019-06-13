import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import './CPD.css'

const useStyles = makeStyles(() => ({
    root: {
        width: '97%',
        overflowX: 'auto',
    },
    table: {
    },
}));

const CPD = ({node, parents, cpd}) => {
    const classes = useStyles();
    const headerRows = cpd.slice(0, parents.length)
    const probabilityRows = cpd.slice(parents.length, cpd.length)

    const header = headerRows.map((row,i) =>
        <TableRow key={`${row[0]}-${i}`}>
            {row.map((e,idx) => (
                <TableCell 
                    key={`${row[0]}-${idx}-${e}`} 
                    align="center" 
                    className={`bold ${idx === 0 ? 'variable-cell' : ''} ${i === (headerRows.length-1) ? 'bottom-border' : 'no-border'}`}>
                    {e}
                </TableCell>
            ))}
        </TableRow>
    );

    const probabilities = probabilityRows.map((row,i) =>
        <TableRow key={`${row[0]}-${i}`} className="probability-row">
            {row.map((e,idx) => (
                <TableCell 
                    key={`${row[0]}-${idx}-${e}`} 
                    align="center"
                    className={`no-border ${idx === 0 ? 'variable-cell nowrap' : ''}`}>
                    {idx === 0 && parents.length ? `${node.id} = ${e}` : e}
                </TableCell>
            ))}
        </TableRow>
    );

    const renderableCPD = header.concat(probabilities)
    const headerLabel = `P(${node.id}${parents.length ? ' | ' : ''}${parents.join(', ')})`
    const long = headerLabel.length >= 45

    return (
        <div className="cpd-wrapper">
            { node && <p className={`${long ? 'selected-node-small' : ''} selected-node label`}>{ headerLabel }</p> }
            <Paper className={classes.root}>
                <Table className={classes.table}>
                    <TableBody>
                        {renderableCPD}
                    </TableBody>
                </Table>
            </Paper>
        </div>
    );
};

export default CPD;

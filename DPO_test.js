describe_indicator('adjusted_DPO_UIUC', 'lower', { shortName: 'DPO', decimals: 'by_symbol_+1' });

const length = input('Length', 21, { min: 1, max: 50 });
const maType = input('MA type', 'sma', constants.ma_types);
const priceType = input('price type', close, constants.price_types); //this is hypotheical as it assumes constants.price_types holds price types

const offset = input('Offset', -11, { min: -50, max: 0 }); // assign variable to offset

const computeMA = indicators[maType];

const priceSma = computeMA(priceType, length); //use input price type

//const halfLength = Math.floor(length / 2);
const shiftback = Math.abs(offset); //adjust for minus value

const dpo = series_of(null);

for (let candleIndex = length; candleIndex < close.length; candleIndex++) { 
    // ensures shiftback doesnt go out of bounds
    if (candleIndex - shiftback -1 >= 0){
        dpo[candleIndex] = close[candleIndex - shiftback - 1] - priceSma[candleIndex];
    }
    else {
        // where calculation cannot be performed, return null
        dpo[candleIndex] = null;
    }
}

paint(dpo, 'Line', '#2595f3');
paint(horizontal_line(0), 'Zero', '#2595f3', 'dotted');


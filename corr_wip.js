describe_indicator('corr_WIP');

/// step 1: user-defined variables ///
const selected_symbol = constants.ticker; //current symbol
const look_back = input('look_back', 54); // a lookback window with default = 53 days (53 trading sessions based on frequency), this is trading days not calender days!
const frequency = input('frequency', 1440); // frequency of data with default = daily, but representing 1440 for 'D' is inaccurate. 1440 minutes in a day?
const group_symbols = ['ADBE', 'ADSK', 'AGYS', 'AI', 'ALRM', 'ALTR', 'AMST', 'AMSWA', 'ANSS', 'API', 'APPS', 'AUGX', 'AUID', 'AUUD', 'AUUDW', 'AYX', 'BAND', 'BIGC', 'BILL', 'BKKT', 'BL', 'BLKB', 'BLZE', 'BMBL',
 'BOX', 'BRZE', 'CALX', 'CANG', 'CCCS', 'CDNS', 'CGNT', 'CHKP', 'CISO', 'CLPS', 'CLSK', 'CMAX', 'CMAXW', 'CMCM', 'CNXC', 'CPTN', 'CPTNW', 'CRM', 'CUEN', 'CVLT', 'CWAN', 'CXM', 'CYBR',
 'DATS', 'DBX', 'DH', 'DOMO', 'DUOL', 'DUOT', 'DV', 'EGAN', 'ENFN', 'ERIC', 'ESTC', 'ETWO', 'EXFY', 'FICO', 'FORA', 'FRGE', 'FROG', 'FRSX', 'FSLY', 'GBTG', 'GLBE',
 'GMGI', 'GVP', 'GWRE', 'HLTH', 'HOOD', 'HUBS', 'ICLK', 'IDAI', 'INPX', 'INST', 'INTA', 'INTU', 'JAMF', 'KARO', 'KC', 'LAW', 'MANH', 'MAPS', 'MAPSW', 'MGIC', 'MITK', 'MIXT', 'MKTW',
 'MOMO', 'MRIN', 'MSFT', 'MSTR', 'MTC', 'MTLS', 'MTTR', 'NCNO', 'NCTY', 'NICE', 'NOW', 'NRC', 'NRDY', 'NTWK', 'NXPL', 'NXPLW', 'NXTP', 'OBLG', 'OLO', 'ONTF', 'OPRA',
 'ORCL', 'PAR', 'PATH', 'PAYC', 'PCTY', 'PRCH', 'PRGS', 'PTC', 'PUBM', 'PWSC', 'PYCR', 'QD', 'RDVT', 'RELY', 'RPD', 'RSSS', 'SAP', 'SDGR', 'SE', 'SHCR',
 'SHCRW', 'SLP', 'SMSI', 'SNCE', 'SNOW', 'SOFO', 'SPLK', 'SPNS', 'SQ', 'SSNT', 'SSTI', 'STEM', 'STER', 'SURG', 'SURGW', 'SWI', 'SWVLW', 'SY', 'TAOP', 'TEAM', 'TUYA', 'TYL', 'UTRS', 'VCSA', 'VMEO', 'VRNS',
 'WDAY', 'WFCF', 'WIMI', 'WK', 'XNET', 'YOU', 'ZI', 'ZM'];
// milestone 1
// this array (and all other arrays of group symbols) should be coded in the lower level
/*const group_symbols = industry(selected_symbol, delisted = false)   -> should be something like this*/
// /milestone 1

// milestone 2
// it appears that request.history() limits to 320 sessions of data
// so if a user wants 30 min frequency, over a lookback period of 30 days, it requires ~270 sessions of data, which is fine
// but if they want 30 mins freq over look-back period of 60 days, it requires more than 320 sessions of data
// /milestone 2


/// step 2: fetch raw stock data ///
const stock_data = {};
for (let symbol_index = 25; symbol_index < group_symbols.length; symbol_index ++){
    const symbol = group_symbols[symbol_index];
    const data = await request.history(symbol, 'D'); // should change this to frequency instead of 'D' to take user-input
    // ensure there's enough data to slice
    if (data.close.length >= look_back) {
        const startIndex = Math.max(data.close.length - look_back, 0); // ensure startIndex is not negative
        // initialize hashmap for the sliced data
        const slicedData = {};
        // iterate over each property (time, open, high, low, close, volume) in data
        Object.keys(data).forEach(key => {
            // slice each array from startIndex to the end
            slicedData[key] = data[key].slice(startIndex);
        });
        stock_data[symbol] = slicedData;
    } else {
        console.log(`not enough data for ${symbol} to slice the last ${look_back} sessions.`);
    }
	if (symbol_index == 29){  // the most significant limitation that we can only fetch 5 request.history in a script, but according to documentation, this limit is "definitely going to be relieved or canceled"
		break;
	}
}
// milestone 3
// when request.history(group_symbols[symbol_index], frequency) encounters a delisted stock, the script returns timeout error.
// it seems that the API expects that available data be retrieved within a few seconds, if not it returns runtime error.
// the usage of setTimeout() is not allowed (currently)
// I tried to add a condition if time taken to fetch current stock is greater than 3 seconds, continue to next symbol, but it is not allowed
// so all symbols in group_symbols must be currently listed
// I manually removed all symbols that are delisted
// but this array is hard-coded, if a stock gets delisted later on, it will return error
// how can we handle this?
// 


const selectedSymbolData = await request.history(selected_symbol, 'D');
if (selectedSymbolData.close.length >= look_back) {
    const startIndex = Math.max(selectedSymbolData.close.length - look_back, 0);
    const selectedSlicedData = {};
    Object.keys(selectedSymbolData).forEach(key => {
        selectedSlicedData[key] = selectedSymbolData[key].slice(startIndex);
    });
    stock_data[selected_symbol] = selectedSlicedData;
} else {
    console.log(`Not enough data for ${selected_symbol} to slice the last ${look_back} sessions.`);
}
// because we can only fetch data for 6 other stocks, we have to always independently fetch data for selected symbol
// when previous limit is removed, we can also remove this part
// /milestone 3


/// step 3: compute log-returns ///
const stockLogReturns = {};
Object.keys(stock_data).forEach(stock => {
    const data = stock_data[stock];
    const logReturns = []; 

    for (let i = 1; i < data.close.length; i++) {
        const currentClose = data.close[i];
        const previousClose = data.close[i - 1];
        const logReturn = Math.log(currentClose) - Math.log(previousClose);
        logReturns.push(logReturn);
    }

    stockLogReturns[stock] = logReturns;
});

/// step 4: correlation functions, as there seems to be no built-in function in Javascript for this ///
function calculateCorrelation(x, y) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    const N = x.length;

    for (let i = 0; i < N; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
    }

    const numerator = (N * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt((N * sumX2 - sumX * sumX) * (N * sumY2 - sumY * sumY));

    return numerator / denominator;
}

/// step 5: X = selected symbol, y = other symbol within the group ///
const X = stockLogReturns[selected_symbol];
const correlations = {};
Object.keys(stockLogReturns).forEach(stock => {
    if (stock !== selected_symbol) {
        // ensure both arrays are of the same length
        const y = stockLogReturns[stock];
        if (X.length === y.length) {
            const corr = calculateCorrelation(X, y);
            correlations[stock] = corr;
        } else {
            console.warn(`mismatching data lengths for ${stock} and ${selected_symbol}, cannot calculate correlation.`); // this shouldn't happen in general, as we already sliced data while fetching raw prices
        }
    }
});


/// step 6: categorize correlations to different ranges ///
let sortedCorr = Object.entries(correlations).sort((a, b) => b[1] - a[1]);
function categoricalCorr(sortedCorr) {
    const categories = {
        'sub_0.5': [],
        '0.5_to_0.6': [],
        '0.6_to_0.7': [],
        '0.7_to_0.8': [],
        '0.8_to_0.9': [],
        'above_0.9': []
    };

    sortedCorr.forEach(([stock, correlation]) => {
        if (correlation < 0.5) {
            categories['sub_0.5'].push([stock, correlation]);
        } else if (correlation >= 0.5 && correlation < 0.6) {
            categories['0.5_to_0.6'].push([stock, correlation]);
        } else if (correlation >= 0.6 && correlation < 0.7) {
            categories['0.6_to_0.7'].push([stock, correlation]);
        } else if (correlation >= 0.7 && correlation < 0.8) {
            categories['0.7_to_0.8'].push([stock, correlation]);
        } else if (correlation >= 0.8 && correlation < 0.9) {
            categories['0.8_to_0.9'].push([stock, correlation]);
        } else if (correlation >= 0.9) {
            categories['above_0.9'].push([stock, correlation]);
        }
    });

    return categories;
}

let categorizedCorr = categoricalCorr(sortedCorr);

/// max correlation within the group ///
let maxCorrelation = -Infinity;
let maxCorrelationStock = null;
Object.entries(correlations).forEach(([stock, correlation]) => {
    if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        maxCorrelationStock = stock;
    }
});
const maxCorr = { 
    stock: maxCorrelationStock, 
    correlation: maxCorrelation 
};
// milestone 4
// use max correlation is simpler to implement
// how to implement to user interface?
// how to implement categorized corr to user interface?
// /milestone 4

console.log(categorizedCorr);
console.log(maxCorr);

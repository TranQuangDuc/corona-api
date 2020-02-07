const express = require('express');
const app = express();
const PORT =  process.env.PORT;
const fs = require('fs');
const pdf = require('pdf-parse');
const pathFileData = './file/20200205-sitrep-16-ncov.pdf';
const DataCountries = require('./utils/DataCountries');
let dataBuffer = fs.readFileSync(pathFileData);
const database = require('./db/connection');
const CountriesModel = require('./db/model/Countries');
database();

app.listen(PORT,(data) => {
    console.log('server run PORT ' + PORT) 
})

app.use('/api/public', require('./router/index'));





app.get('/api/UpdateCorona', (req,res) => {
    try {
        pdf(dataBuffer).then(function(data) {
            let dataBegin =  data.text.indexOf('Table 2. Countries, territories or areas with reported confirmed 2019-nCoV cases and deaths.');
            let dataEnd = data.text.indexOf('Case classifications are based on WHO case definitions for 2019-nCoV.');
            let dataTable = data.text.substring(dataBegin,dataEnd)

            let dataBeginChina = data.text.indexOf('SITUATION IN NUMBERS total and new cases in last 24 hours');
            let dataEndChina = data.text.indexOf('WHO RISK ASSESSMENT');
            let dataTableChina = data.text.substring(dataBeginChina,dataEndChina)

            let China = dataTableChina.substring(dataTableChina.indexOf('China') + 5,dataTableChina.length);
           
            let deathsString = China.substring(China.indexOf('severe'),China.indexOf('deaths'));
            let deathsArray = deathsString.split(' ');
            let deathsArrayEnd = deathsArray.filter((value) => {
               
                    if(value.indexOf('(') == -1 && value.indexOf(')') == -1 && value.indexOf('\n') == -1 && value != '' ) {
                        return value;
                    }
             
            })
            console.log(deathsArrayEnd);
            
            let TotalDataCorona = [{
                country : 'China',
                confirmed : China.substring(0,China.indexOf('confirmed')).replace('\n','').trim(),
                travelHistoryChina :  0,
                deaths : deathsArrayEnd[1]  
            }];

            console.log(TotalDataCorona);
            
        
            for (let index = 0; index < DataCountries.length; index++) {
                const element = DataCountries[index];
                let Singapore = dataTable.substring(dataTable.indexOf(element) + (element.length-1),dataTable.length);
                let arraySingapore = Singapore.split(' ');
                let arraySingaporeNew = arraySingapore.filter((value) => {
                    if(value.indexOf('(') == -1) {
                        return value;
                    }
                })
        
                
                let dataSingapore = {
                    country : element,
                    confirmed : arraySingaporeNew[1],
                    travelHistoryChina : arraySingaporeNew[2],
                    deaths : arraySingaporeNew[5].replace('\n','')
                }
                TotalDataCorona.push(dataSingapore);
            }

            let addCon = new CountriesModel({
                list : TotalDataCorona
            });

            addCon.save();
        
            res.json({
                status : 200
            })
        });
    } catch (error) {
        res.json({
            status : 501
        })
    }
})
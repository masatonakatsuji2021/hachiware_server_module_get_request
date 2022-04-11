/**
 * ============================================================================================================
 * Hachiware_Server_module_get_request
 * 
 * Module for receiving request data (GET / POST request) of Web server package "hachiware_server" .
 * 
 * License : MIT License. 
 * Since   : 2022.01.15
 * Author  : Nakatsuji Masato 
 * GitHub  : https://github.com/masatonakatsuji2021/Hachiware_Server_module_get_request
 * npm     : https://www.npmjs.com/package/Hachiware_Server_module_get_request
 * ============================================================================================================
 */

module.exports = function(conf){

    if(!conf.getRequests){
        conf.getRequests = {};
    }

    if(conf.getRequests.passive){

        /**
         * getQuery
         * @param {*} req 
         * @returns 
         */
        this.getQuery = function(req){
            return getQuery(req);
        };

        /**
         * getBody
         * @param {*} req 
         * @param {*} callback 
         */
        this.getBody = function(req, callback){
            getBody(req, callback);
        };
    }

    const getQuery = function(req){

        var url = req.url;
        var queryStr = url.split("?")[1];
        var query = {};

        if(queryStr){
            var qbuff = queryStr.split("&");
            for(var n = 0 ; n < qbuff.length ; n++){
                var q_ = qbuff[n].split("=");

                query[q_[0]] = q_[1];
            }
        }

        return query;
    };

    const getBody = function(req, callback){

        var bodyBuff = null;

        req.on("data",function(data){
            if(!bodyBuff){
                bodyBuff = "";
            }
            bodyBuff += data;
        }).on("end", function(){

            var contentType = req.headers["content-type"];
            var body = null;
            
            if(!bodyBuff){
                return callback(body);
            }

            if(contentType == "application/json"){
                body = JSON.parse(bodyBuff);
            }
            else if(contentType == "application/x-www-form-urlencoded"){
                body = {};
                var bbuff = bodyBuff.split("&");
                for(var n = 0 ; n < bbuff.length ; n++){
                    var b_ = bbuff[n].split("=");
                    var field = b_[0];

                    if(field.indexOf("%5B%5D") > 0){
                        field = field.replace("%5B%5D","");
                        if(!body[field]){
                            body[field] = [];                            
                        }
                        body[field].push(b_[1]);
                    }
                    else{
                        body[field] = b_[1];    
                    }
                }
            }
            else if(contentType == "multipart/form-data"){
                //......
                body = bodyBuff;
            }
            else{
                body = bodyBuff;
            }

            callback(body);
        });
    };

     /**
     * fookRequest
     * @param {*} resolve 
     * @param {*} req 
     * @returns 
     */
    this.fookRequest = function(resolve, req){

        if(conf.getRequests.passive){
            return resolve();
        }

        var query = getQuery(req);
        req.query = query;

        if(req.method == "GET"){
            req.body = null;
            resolve();
        }
        else{
            
            getBody(req, function(body){

                req.body = body;
                resolve();
            });
        }

    };

    /**
     * frameworkAdapter
     * Hook to specify the method to provide to the framework
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
     this.frameworkAdapter = function(req){

        if(!conf.getRequests.passive){
            return;
        }

        var vm = this;

        var getRequests = function(req){

            /**
             * getQuery
             * @returns 
             */
            this.getQuery = function(){
                return vm.getQuery(req);
            };

            /**
             * getBody
             * @param {*} callback 
             * @returns 
             */
            this.getBody = function(callback){
                return vm.getBody(req, callback);
            };
        };

        return new getRequests(req);
    };
};
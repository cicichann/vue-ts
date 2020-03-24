/* eslint-disable */
/**
 * @author
 * @description 大花脸比较功能，完成某段文本多个版本差异的比较，并将差异结果在一个界面上显示出来。
 * @keywords compare, merge
 */
let bigface = function() {

    function BigFace(contentFieldName) {
        //因为execute接口传入的为json数据，其中json里面包含字符串内容，创建者、操作时间等字段；
        //故需要明确哪个字段为当前需要比较的字段
        //另外，对文章进行版本比较时，既需要比较文档的标题，也需要比较正文内容。
        this.fieldName = contentFieldName || "content";

        //Increase computational efficiency by factoring out short commonalities which are not worth the overhead. The larger the edit cost, the more agressive the cleanup.

        this.diff_EditCost = 8;

    }

    BigFace.prototype = {

        /**
         * 对多个版本进行比较，返回比较合并后的结果
         * @param  {Array} jsonVersions json数组，其中的每个元素结构为：{
        			"TRUENAME":"huxiejin", //创建者
        			"CRTIME":"2016-1-14 15:16:50", //创建时间
        			"TITLE" : "THIS IS TITLE",
        			"CONTENT":"hello world", //当前版本的数据
        			"versionNum":1 //当前的版本号，需要为一个数字
        		}
         * @return {[type]}              [description]
         */

        execute: function(jsonVersions) {

            var compareResult, mergeResult;

            for (var i = 0, length = jsonVersions.length - 1; i < length; i++) {

                //compareResult = this.compare(jsonVersions[i], jsonVersions[i + 1]);
                compareResult = this.googleCompare(jsonVersions[i],jsonVersions[i + 1]);
                var tt =i;
                mergeResult = this.merge(mergeResult, compareResult);


            }


            return mergeResult;
        },




        /**
         * 比较左右两个版本，返回比较结果{left:{},right:{}, ranges:[]},
         * 其中left,right分别为leftVersion,rightVersion;
         *  // code to be executed
         *			 /*google结果转换
         *			 		abcdef
				 *			 		a1bdef
				 *			google结果
         *			 //操作	0  1  0   -1   0
				 *	  	 //内容 a  1  b    c   def
				 *			 对比反馈结果
				 *			  ={sp1:0,ep1:1,sp2:0,ep2:1}
 				 *  			+{sp1:2,ep1:2,sp2:1,ep2:2}
 				 *				={sp1:1,ep1:2,sp2:2,ep2:3}
 				 *				-{sp1:2,ep1:3,sp2:4,ep2:4}
 				 *				={sp1:4,ep1:7,sp2:4,ep2:7}
				 *
				 *   ranges:[] ={ type: '-',
                        sp1: sp1,
                        ep1: ep1,
                        sp2: sp2,
                        ep2: ep2,
                        "TRUENAME": rightVersion.TRUENAME,
                        "CRTIME": rightVersion.CRTIME,
                        "versionNum": rightVersion.versionNum,
                        fragment: tmprange[1]}
         * type:'-' '=' '+'
         * ranges为比较后的片段，如：
         * 1）{sp1:2,ep1:29,sp2:4,ep2:31}表示左侧从索引位2到29的字符串与右侧4到31的字符串区域相等；
         * 2）{sp1:2,ep1:2,sp2:4,ep2:31}表示右侧字符串索引位从4到31的是新增字符串，并且在左侧索引位2前面新增；
         * 3）{sp1:2,ep1:29,sp2:4,ep2:4}表示右侧字符串从位置4开始，对左侧索引位从2到29的进行了删除；
         * fragment 为增、删或者相同的字符内容
				 *
				 *
				 *
         * @return {Object}              返回比较结果{left:{},right:{}, ranges:[]}
         *修改为google diff 算法的版本对比，并且把google原有算法返回结果转换为现有合并结果
         *html需引用diff_match_patch.js
         *目前采用Efficiency Cleanup 模式，可以根据文本性质研究采用另外的模式
         *参考url https://neil.fraser.name/software/diff_match_patch/svn/trunk/demos/demo_diff.html
         */
        googleCompare: function(leftVersion, rightVersion){
					//获取对比文本信息
        	var leftContent = leftVersion[this.fieldName];
          var rightContent = rightVersion[this.fieldName];
					var ranges = [];

					//引用 diff_match_patch.js 文件初始化diff
        	var dmp = new diff_match_patch();
         		//获得No Cleanup模式结果
         		var a = dmp.diff_main(leftContent, rightContent);

         		//通过Efficiency Cleanup处理数据， 根据edit cost参数来配置
         		dmp.Diff_EditCost = this.diff_EditCost ;
         		dmp.diff_cleanupEfficiency(a);

         		var leftLen = 0;
         		var rightLen = 0;


         				for (var i = 0; i < a.length; i++) {
         					 // code to be executed


         					 var tmprange = a[i];
         					 switch (tmprange[0]) {
         					 	case -1:
         					 		 // statements
         					 		 var sp1 = leftLen;
         					 		 var ep1 = sp1+tmprange[1].length;
         					 		 var sp2 = rightLen;
         					 		 var ep2 = sp2;


         					 		 ranges.push({
                        type: '-',
                        sp1: sp1,
                        ep1: ep1,
                        sp2: sp2,
                        ep2: ep2,
                        "updateUser": rightVersion.updateUser,
                        "updateTime": rightVersion.updateTime,
                        "versionNum": rightVersion.versionNum,
                        fragment: tmprange[1]
                    });


         					 		 leftLen =leftLen+tmprange[1].length;
         					 	break;
         					 	case 0:
         					 		 // statements
         					 		 var sp1 = leftLen;
         					 		 var ep1 = sp1+tmprange[1].length;
         					 		 var sp2 = rightLen;
         					 		 var ep2 = sp2+tmprange[1].length;
         					 		  ranges.push({
                        type: '=',
                        sp1: sp1,
                        ep1: ep1,
                        sp2: sp2,
                        ep2: ep2,
                        "updateUser": rightVersion.updateUser,
                        "updateTime": rightVersion.updateTime,
                        "versionNum": rightVersion.versionNum,
                        fragment: tmprange[1]
                    });
         					 		 leftLen =leftLen+tmprange[1].length;
         					 		 rightLen =rightLen+tmprange[1].length;
         					 	break;
         					 	case 1:
         					 		 // statements
         					 		 var sp1 = leftLen;
         					 		 var ep1 = sp1;
         					 		 var sp2 = rightLen;
         					 		 var ep2 = sp2+tmprange[1].length;

         					 		 ranges.push({
                        type: '+',
                        sp1: sp1,
                        ep1: ep1,
                        sp2: sp2,
                        ep2: ep2,
                        "updateUser": rightVersion.updateUser,
                        "updateTime": rightVersion.updateTime,
                        "versionNum": rightVersion.versionNum,
                        fragment: tmprange[1]
                    });

         					 		 rightLen =rightLen+tmprange[1].length;

         					 	break;

         					 	default:
         					 		// default statements
         					 }
         				}
         		 return {
                ranges: ranges,
                left: leftVersion,
                right: rightVersion
            };
        },




        initMergeResult: function(compareResult) {
            var mergeResult = [];
            var leftVersion = compareResult.left;
            var rightVersion = compareResult.right;
            var compareRanges = compareResult.ranges;

            for (var i = 0, length = compareRanges.length; i < length; i++) {
                var compareRange = compareRanges[i];
                var versionObj = compareRange.type == '+' ? rightVersion : leftVersion;
                var itemRange = extend({}, compareRange, {
                    "updateUser": (compareRange.type == '=' ? leftVersion : rightVersion).updateUser,
                    "updateTime": (compareRange.type == '=' ? leftVersion : rightVersion).updateTime,
                    "versionNum": versionObj.versionNum,
                    "lv": rightVersion.versionNum //最近的版本lastversion
                });

                mergeResult.push(itemRange);
            }

            return mergeResult;
        },

        merge: function(mergeResult, compareResult) {
            //第一个版本比较结果，直接从compareResult获取merge结果
            if (!mergeResult) {
                return this.initMergeResult(compareResult);
            }

            this.mergeIndex = 0;
            var compareRanges = compareResult.ranges;
            for (var i = 0; i < compareRanges.length; i++) {
            	if (i==34) {
            		console.log(i);
            	}
                this.mergeRange(mergeResult, compareResult, i);
            }

            return mergeResult;
        },

        mergeRange: function(mergeResult, compareResult, compareIndex) {
            var compareRange = compareResult.ranges[compareIndex];

            //find mergeIndex
            //存在修改模式的情况，而此时比较的索引位不变。
            var mergeIndex = this.mergeIndex || 0;

            for (; mergeIndex < mergeResult.length; mergeIndex++) {

                var mergeRange = mergeResult[mergeIndex];

                //删除的内容，对后面的版本不可见，故可以直接忽略
                if (mergeRange.type == '-') {
                    continue;
                }

                //非相邻版本，可以直接忽略，compareRange仅和相邻的前一个版本进行比较
                if (compareRange.versionNum - mergeRange.lv != 1) {
                    continue;
                }

                if (mergeRange.sp2 == compareRange.sp1) {
                    break;
                }
            }

            this.mergeIndex = mergeIndex;
            if (mergeIndex >= mergeResult.length) {
                mergeResult.push(extend({}, compareRange, {
                    "lv": compareRange.versionNum //最近的版本lastversion
                }));
                return;
            }

            var method = mergeResult[mergeIndex].type + compareRange.type;
            this.mergeRangeImpl[method].call(this, mergeResult, mergeIndex, compareResult, compareIndex);
        },

        mergeRangeImpl: {
            '==': function(mergeResult, mergeIndex, compareResult, compareIndex) {
                var mergeRange = mergeResult[mergeIndex];
                var compareRange = compareResult.ranges[compareIndex];
                var mep2 = mergeRange.ep2;
                var cep1 = compareRange.ep1;
                if (mep2 > cep1) {
                    var range1 = extend({}, compareRange, {
                        "updateUser": mergeRange.updateUser,
                        "versionNum": mergeRange.versionNum,
                        "updateTime": mergeRange.updateTime,
                        "lv": compareRange.versionNum //最近的版本lastversion
                    });
                    mergeResult.splice(mergeIndex, 1, range1);

                    var length = compareRange.fragment.length;
                    var fragment = mergeRange.fragment.substr(length);
                    var range2 = extend({}, mergeRange, {
                        "sp1": mergeRange.ep1 - fragment.length,
                        "sp2": mergeRange.ep2 - fragment.length,
                        "fragment": fragment
                    });
                    mergeResult.splice(mergeIndex + 1, 0, range2);
                } else {
                    var length = mergeRange.fragment.length;

                    var range1 = extend({}, compareRange, {
                        "updateUser": mergeRange.updateUser,
                        "versionNum": mergeRange.versionNum,
                        "updateTime": mergeRange.updateTime,
                        "ep1": compareRange.sp1 + length,
                        "ep2": compareRange.sp2 + length,
                        "fragment": compareRange.fragment.substr(0, length),
                        "lv": compareRange.versionNum //最近的版本lastversion
                    });
                    mergeResult.splice(mergeIndex, 1, range1);
                    compareResult.ranges.splice(compareIndex, 1, extend({}, range1));

                    var range2 = extend({}, compareRange, {
                        "sp1": range1.ep1,
                        "sp2": range1.ep2,
                        "fragment": compareRange.fragment.substr(length)
                    });

                    if (range2.fragment.length > 0) {
                        compareResult.ranges.splice(compareIndex + 1, 0, range2);
                    }
                }
            },
            '=+': function(mergeResult, mergeIndex, compareResult, compareIndex) {
                var mergeRange = mergeResult[mergeIndex];
                var compareRange = compareResult.ranges[compareIndex];
                var range = extend({}, compareRange, {
                    "lv": compareRange.versionNum //最近的版本lastversion
                });
                mergeResult.splice(mergeIndex, 0, range);
            },
            '=-': function(mergeResult, mergeIndex, compareResult, compareIndex) {
                var mergeRange = mergeResult[mergeIndex];
                var compareRange = compareResult.ranges[compareIndex];
                var mep2 = mergeRange.ep2;
                var cep1 = compareRange.ep1;
                if (mep2 > cep1) {
                    var length = compareRange.fragment.length;
                    var offset = 0;
                    if (mergeRange.versionNum != 1) { //非初始版本
                        var range = extend({}, mergeRange, {
                            "ep1": mergeRange.sp1 + length,
                            "ep2": mergeRange.sp2 + length,
                            "fragment": compareRange.fragment
                        });
                        offset++;
                        mergeResult.splice(mergeIndex, 0, range);
                    }

                    var range1 = extend({}, compareRange, {
                        "versionNum": mergeRange.versionNum,
                        "updateTime": compareRange.updateTime,
                        "lv": compareRange.versionNum //最近的版本lastversion
                    });

                    var fragment = mergeRange.fragment.substr(length);
                    var range2 = extend({}, mergeRange, {
                        "sp1": mergeRange.ep1 - fragment.length,
                        "sp2": mergeRange.ep2 - fragment.length,
                        "fragment": fragment
                    });

                    mergeResult.splice(mergeIndex + offset, 1, range1, range2);
                } else {
                    var length = mergeRange.fragment.length;

                    var range1 = extend({}, compareRange, {
                        "ep1": compareRange.sp1 + length,
                        "ep2": compareRange.sp2,
                        "fragment": mergeRange.fragment,
                        "lv": compareRange.versionNum //最近的版本lastversion
                    });
                    mergeResult.splice(mergeIndex, 1, range1);
                    compareResult.ranges.splice(compareIndex, 1, extend({}, range1));

                    var range2 = extend({}, compareRange, {
                        "sp1": range1.ep1,
                        "sp2": range1.ep2,
                        "fragment": compareRange.fragment.substr(length),
                        "lv": compareRange.versionNum //最近的版本lastversion
                    });

                    if (range2.fragment.length > 0) {
                        compareResult.ranges.splice(compareIndex + 1, 0, range2);
                    }
                }
            },
            '+=': function(mergeResult, mergeIndex, compareResult, compareIndex) {
                var mergeRange = mergeResult[mergeIndex];
                var compareRange = compareResult.ranges[compareIndex];
                var mep2 = mergeRange.ep2;
                var cep1 = compareRange.ep1;
                if (mep2 > cep1) {

                    var range1 = extend({}, compareRange, {
                        "type": '+',
                        "ep1": compareRange.sp1,
                        "updateUser": mergeRange.updateUser,
                        "versionNum": mergeRange.versionNum,
                        "updateTime": mergeRange.updateTime,
                        "lv": compareRange.versionNum //最近的版本lastversion
                    });

                    var length = compareRange.fragment.length;
                    var fragment = mergeRange.fragment.substr(length);
                    var range2 = extend({}, mergeRange, {
                        "sp2": mergeRange.ep2 - fragment.length,
                        "fragment": fragment
                    });

                    mergeResult.splice(mergeIndex, 1, range1, range2);
                } else {
                    var length = mergeRange.fragment.length;

                    var range1 = extend({}, compareRange, {
                        "type": "+",
                        "updateUser": mergeRange.updateUser,
                        "versionNum": mergeRange.versionNum,
                        "updateTime": mergeRange.updateTime,
                        "ep1": compareRange.sp1,
                        "ep2": compareRange.sp2 + length,
                        "fragment": mergeRange.fragment,
                        "lv": compareRange.versionNum //最近的版本lastversion
                    });
                    mergeResult.splice(mergeIndex, 1, range1);

                    //compareResult.ranges.splice(compareIndex, 1, extend({}, range1));
                    var tmpa = extend({}, range1);
										compareResult.ranges.splice(compareIndex, 1, extend({}, range1));

                    var fragment = compareRange.fragment.substr(length);
                    var range2 = extend({}, compareRange, {
                        "sp1": compareRange.ep1 - fragment.length,
                        "sp2": compareRange.ep2 - fragment.length,
                        "fragment": fragment
                    });

                    if (range2.fragment.length > 0) {
                        compareResult.ranges.splice(compareIndex + 1, 0, range2);
                    }
                }
            },
            '++': function(mergeResult, mergeIndex, compareResult, compareIndex) {
                var mergeRange = mergeResult[mergeIndex];
                var compareRange = compareResult.ranges[compareIndex];
                var range = extend({}, compareRange, {
                    "lv": compareRange.versionNum //最近的版本lastversion
                });
                mergeResult.splice(mergeIndex, 0, range);
            },
            '+-': function(mergeResult, mergeIndex, compareResult, compareIndex) {
                var mergeRange = mergeResult[mergeIndex];
                var compareRange = compareResult.ranges[compareIndex];
                var mep2 = mergeRange.ep2;
                var cep1 = compareRange.ep1;
                if (mep2 > cep1) {
                    var length = compareRange.fragment.length;

                    var range = extend({}, mergeRange, {
                        "ep1": mergeRange.sp1 + length,
                        "ep2": mergeRange.sp2 + length,
                        "fragment": compareRange.fragment
                    });

                    mergeResult.splice(mergeIndex, 0, range);

                    var range1 = extend({}, compareRange, {
                        "lv": compareRange.versionNum, //最近的版本lastversion
												"last": '1',//上一操作标记 及操作记录
												"updateTime_last": mergeRange.updateTime,
												"updateUser_last": mergeRange.updateUser,
												"versionNum_last": mergeRange.versionNum
                    });

                    var fragment = mergeRange.fragment.substr(length);
                    var range2 = extend({}, mergeRange, {
                        "updateUser": mergeRange.updateUser,
                        "versionNum": mergeRange.versionNum,
                        "updateTime": mergeRange.updateTime,
                        "sp1": mergeRange.ep1,
                        "sp2": mergeRange.ep2 - fragment.length,
                        "fragment": fragment
                    });

                    mergeResult.splice(mergeIndex, 2, range1, range2);
                } else {
                    var length = mergeRange.fragment.length;

                    var range1 = extend({}, compareRange, {
                        "ep1": compareRange.sp1 + length,
                        "ep2": compareRange.sp2,
                        "fragment": mergeRange.fragment,
                        "lv": compareRange.versionNum,//最近的版本lastversion
												"last": '1',//上一操作标记 及操作记录
												"updateTime_last": mergeRange.updateTime,
												"updateUser_last": mergeRange.updateUser,
												"versionNum_last": mergeRange.versionNum
                    });
                    mergeResult.splice(mergeIndex, 1, range1);
                    compareResult.ranges.splice(compareIndex, 1, extend({}, range1));

                    var range2 = extend({}, compareRange, {
                        "sp1": range1.ep1,
                        "sp2": range1.ep2,
                        "fragment": compareRange.fragment.substr(length),
                        "lv": compareRange.versionNum //最近的版本lastversion
                    });

                    if (range2.fragment.length > 0) {
                        compareResult.ranges.splice(compareIndex + 1, 0, range2);
                    }
                }
            }
        }
    };

    //util
    function extend(dst, src) {
        if (arguments.length > 2) {
            for (var index = 1, length = arguments.length; index < length; index++) {
                extend(dst, arguments[index]);
            }
            return dst;
        }

        for (var key in src) {
            dst[key] = src[key];
        }
        return dst;
    }



    var trs = window.trs = window.trs || {};
    trs.BigFace = BigFace;

};

export default bigface

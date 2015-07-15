(function ($) {
    /**
     * Simplified Chinese language package
     * Translated by @shamiao
     */
    $.fn.bootstrapValidator.i18n = $.extend(true, $.fn.bootstrapValidator.i18n, {
        between: {
            'default': '请输入在 %s 和 %s 之间的数值',
            notInclusive: '请输入在 %s 和 %s 之间(不含两端)的数值'
        },
        callback: {
            'default': '请输入有效的值'
        },
        choice: {
            'default': '请输入有效的值',
            less: '请至少选中 %s 个选项',
            more: '最多只能选中 %s 个选项',
            between: '请选择 %s 至 %s 个选项'
        },
        date: {
            'default': '请输入有效的日期', 
            min: '请输入 %s 或之后的日期',
            max: '请输入 %s 或以前的日期',
            range: '请输入 %s 和 %s 之间的日期'
        },
        different: {
            'default': '请输入不同的值'
        },
        digits: {
            'default': '请输入有效的数字'
        },
        emailAddress: {
            'default': '请输入有效的邮件地址'
        },
        file: {
            'default': '请选择有效的文件'
        },
        greaterThan: {
            'default': '请输入大于等于 %s 的数值',
            notInclusive: '请输入大于 %s 的数值'
        },
        identical: {
            'default': '请输入相同的值'
        },
        integer: {
            'default': '请输入有效的整数值'
        },
        
        lessThan: {
            'default': '请输入小于等于 %s 的数值',
            notInclusive: '请输入小于 %s 的数值'
        },
        
        notEmpty: {
            'default': '请填写必填项目'
        },
        numeric: {
            'default': '请输入有效的数值，允许小数'
        },
        phone: {
            'default': '请输入有效的电话号码',
            countryNotSupported: '不支持 %s 国家或地区',
            country: '请输入有效的 %s 国家或地区的电话号码',
            countries: {
                CN: '中国'
            }
        },
        regexp: {
            'default': '请输入符合正则表达式限制的值'
        },
        remote: {
            'default': '请输入有效的值'
        },
        stringCase: {
            'default': '只能输入小写字母',
            upper: '只能输入大写字母'
        },
        stringLength: {
            'default': '请输入符合长度限制的值',
            less: '最多只能输入 %s 个字符',
            more: '需要输入至少 %s 个字符',
            between: '请输入 %s 至 %s 个字符'
        },
        uri: {
            'default': '请输入一个有效的URL地址'
        }
    });
}(window.jQuery));

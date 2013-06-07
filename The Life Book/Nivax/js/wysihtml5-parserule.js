var wysihtml5ParserRules = {
    tags: {
        strong: {},
        b: {},
        i: {},
        em: {},
        br: {},
        p: {
            "rename_tag": "div"
        },
        div: {},
        span: {},
        ul: {},
        ol: {},
        li: {},
        a: {
            set_attributes: {
                target: "_blank",
                rel: "nofollow"
            },
            check_attributes: {
                href: "url" // important to avoid XSS
            }
        }
    }
};
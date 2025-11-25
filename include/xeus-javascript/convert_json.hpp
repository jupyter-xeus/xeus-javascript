#pragma once

#include <nlohmann/json.hpp>
#include <emscripten/bind.h>
#include <emscripten/emscripten.h>

// decay_t
#include <type_traits>

namespace emscripten {
namespace internal {

namespace nl = nlohmann;

template <>
struct BindingType<nl::json> {
    using ValBinding = BindingType<val>;
    using WireType = typename ValBinding::WireType;

    #if __EMSCRIPTEN_major__ == 3 && __EMSCRIPTEN_minor__ == 1 && __EMSCRIPTEN_tiny__ <= 45
    static WireType toWireType(const nl::json& obj) {
        // as string
        const auto str = obj.dump();
        const auto jstr = val(str.c_str());
        const auto js_obj = val::global("JSON").call<val>("parse", jstr);
        return ValBinding::toWireType(js_obj);
    }
    #else
    template<typename ReturnPolicy = void>
    static WireType toWireType(const nl::json& obj, rvp::default_tag) {
        // as string
        const auto str = obj.dump();
        const auto jstr = val(str.c_str());
        const auto js_obj = val::global("JSON").call<val>("parse", jstr);
        return ValBinding::toWireType(js_obj, rvp::default_tag{});
    }
    #endif

    template<typename ReturnPolicy = void>
    static nl::json fromWireType(WireType value ) {
        // first as emscripten::val
        const auto js_obj = ValBinding::fromWireType(value);
        // then as string
        const auto jstr = val::global("JSON").call<val>("stringify", js_obj);
        const auto str = jstr.as<std::string>();
        return nl::json::parse(str);
    }
};

#ifdef XEUS_JAVASCRIPT_EMSCRIPTEN_OLD


template <typename T>
using is_decayed_json = std::is_same<std::decay_t<T>, nl::json>;

template <typename T>
using enable_if_decayed_json = typename std::enable_if<is_decayed_json<T>::value, void>::type;

template<class T>
struct TypeID<T, enable_if_decayed_json<T> > {
    static constexpr TYPEID get() {
        return LightTypeID<val>::get();
    }
};

#endif

}  // namespace internal
}  // namespace emscripten
